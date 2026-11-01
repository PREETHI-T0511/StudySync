import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { acceptGroupInvitation } from "@/lib/invitations";
import {
  errorResponse,
  HttpError,
  readJsonObject,
  requiredString,
} from "@/lib/http";
import { SESSION_COOKIE_NAME } from "@/lib/session-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>> | undefined;
  try {
    const body = await readJsonObject(request);
    const studentName = requiredString(body, "studentName", 100)!;
    const email = requiredString(body, "email", 100)!.toLowerCase();
    const password = requiredString(body, "password", 128)!;
    const department = requiredString(body, "department", 100, { optional: true });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, "Enter a valid email address.");
    }
    if (password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters long.");
    }

    const semesterValue = body.semester;
    const semester =
      semesterValue === undefined || semesterValue === null || semesterValue === ""
        ? null
        : Number(semesterValue);
    if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 20)) {
      throw new HttpError(400, "Semester must be a whole number between 1 and 20.");
    }

    const cgpaValue = body.cgpa;
    const cgpa =
      cgpaValue === undefined || cgpaValue === null || cgpaValue === ""
        ? null
        : Number(cgpaValue);
    if (cgpa !== null && (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10)) {
      throw new HttpError(400, "CGPA must be between 0 and 10.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const invitationToken =
      body.invitationToken === undefined
        ? null
        : requiredString(body, "invitationToken", 64);
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO STUDENT
        (student_name, email, password, department, semester, cgpa)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [studentName, email, passwordHash, department, semester, cgpa],
    );
    const studentId = (result as { insertId: number }).insertId;
    if (invitationToken) {
      await acceptGroupInvitation(connection, invitationToken, studentId, email);
    }
    await connection.commit();
    const { token, expiresAt } = await createSession(studentId, false);
    const response = NextResponse.json(
      {
        student: {
          studentId,
          studentName,
          email,
          department,
          semester,
          cgpa,
        },
      },
      { status: 201 },
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(expiresAt * 1000),
    });
    return response;
  } catch (error) {
    if (connection) await connection.rollback();
    return errorResponse(error);
  } finally {
    connection?.release();
  }
}
