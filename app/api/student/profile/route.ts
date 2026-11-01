import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import {
  errorResponse,
  HttpError,
  optionalString,
  readJsonObject,
  requiredString,
} from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ student: await requireUser() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await readJsonObject(request);
    const studentName = requiredString(body, "studentName", 100)!;
    const department = optionalString(body, "department", 100);
    const semester =
      body.semester === undefined || body.semester === null || body.semester === ""
        ? null
        : Number(body.semester);
    const cgpa =
      body.cgpa === undefined || body.cgpa === null || body.cgpa === ""
        ? null
        : Number(body.cgpa);

    if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 20)) {
      throw new HttpError(400, "Semester must be a whole number between 1 and 20.");
    }
    if (cgpa !== null && (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10)) {
      throw new HttpError(400, "CGPA must be between 0 and 10.");
    }

    await getPool().execute(
      `UPDATE STUDENT
      SET student_name = ?, department = ?, semester = ?, cgpa = ?
      WHERE student_id = ?`,
      [studentName, department, semester, cgpa, user.studentId],
    );
    return NextResponse.json({
      student: { ...user, studentName, department, semester, cgpa },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
