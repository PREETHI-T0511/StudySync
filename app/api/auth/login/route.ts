import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { createSession } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  readJsonObject,
  requiredString,
} from "@/lib/http";
import { SESSION_COOKIE_NAME } from "@/lib/session-token";

export const runtime = "nodejs";

type LoginRow = RowDataPacket & {
  student_id: number;
  student_name: string;
  email: string;
  password: string;
  department: string | null;
  semester: number | null;
  cgpa: number | string | null;
};

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const email = requiredString(body, "email", 100)!.toLowerCase();
    const password = requiredString(body, "password", 128)!;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, "Enter a valid email address.");
    }

    const [rows] = await getPool().execute<LoginRow[]>(
      `SELECT student_id, student_name, email, password, department, semester, cgpa
      FROM STUDENT
      WHERE email = ?`,
      [email],
    );
    const student = rows[0];
    if (!student) {
      throw new HttpError(
        404,
        "No account exists for this email address.",
        "ACCOUNT_NOT_FOUND",
      );
    }
    if (!(await bcrypt.compare(password, student.password))) {
      throw new HttpError(401, "Email or password is incorrect.");
    }

    const { token, expiresAt } = await createSession(
      student.student_id,
      body.rememberMe === true,
    );
    const response = NextResponse.json({
      student: {
        studentId: student.student_id,
        studentName: student.student_name,
        email: student.email,
        department: student.department,
        semester: student.semester,
        cgpa: student.cgpa === null ? null : Number(student.cgpa),
      },
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(expiresAt * 1000),
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
