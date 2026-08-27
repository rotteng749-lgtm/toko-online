export function jsonOk(data: any, status: number = 200) {
  return Response.json(data, { status });
}

export function jsonError(reason: string, status: number = 400) {
  return Response.json({ ok: false, reason }, { status });
}
