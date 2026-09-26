import { isValidRange } from "./businessHours";
import { colorForIndex, MAX_MEMBER_NAME_LENGTH } from "./members";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

interface MemberRow {
  name: string;
  color: string;
}

async function handleMembers(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "select name, color from members order by created_at asc",
    ).all<MemberRow>();
    return json({ data: results ?? [] });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as { name?: string };
    const name = (body.name ?? "").trim();
    if (!name) return json({ error: "名前を入力してください。" }, 400);
    if (name.length > MAX_MEMBER_NAME_LENGTH) {
      return json(
        { error: `名前は${MAX_MEMBER_NAME_LENGTH}文字以内にしてください。` },
        400,
      );
    }

    const { results } = await env.DB.prepare(
      "select name from members",
    ).all<MemberRow>();
    const existingNames = (results ?? []).map((r) => r.name);
    if (existingNames.includes(name)) {
      return json({ error: "その名前はすでに登録されています。" }, 400);
    }

    const color = colorForIndex(existingNames.length);
    await env.DB.prepare(
      "insert into members (id, name, color) values (?, ?, ?)",
    )
      .bind(crypto.randomUUID(), name, color)
      .run();
    return json({ data: { name, color } }, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}

async function handleSlots(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!start || !end) return json({ error: "start/end is required" }, 400);
    const { results } = await env.DB.prepare(
      "select id, member, slot_date, start_time, end_time, created_at from slots where slot_date >= ? and slot_date <= ? order by slot_date asc",
    )
      .bind(start, end)
      .all();
    return json({ data: results ?? [] });
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      member?: string;
      slot_date?: string;
      start_time?: string;
      end_time?: string;
    };
    const { member, slot_date, start_time, end_time } = body;
    if (!member || !slot_date || !start_time || !end_time) {
      return json({ error: "必要な項目が不足しています。" }, 400);
    }

    const date = new Date(`${slot_date}T00:00:00`);
    const validationError = isValidRange(
      date,
      start_time.slice(0, 5),
      end_time.slice(0, 5),
    );
    if (validationError) return json({ error: validationError }, 400);

    const memberRow = await env.DB.prepare(
      "select name from members where name = ?",
    )
      .bind(member)
      .first();
    if (!memberRow)
      return json({ error: "登録されていないメンバーです。" }, 400);

    const existing = await env.DB.prepare(
      "select id from slots where member = ? and slot_date = ?",
    )
      .bind(member, slot_date)
      .first<{ id: string }>();

    if (existing) {
      await env.DB.prepare(
        "update slots set start_time = ?, end_time = ? where id = ?",
      )
        .bind(start_time, end_time, existing.id)
        .run();
    } else {
      await env.DB.prepare(
        "insert into slots (id, member, slot_date, start_time, end_time) values (?, ?, ?, ?, ?)",
      )
        .bind(crypto.randomUUID(), member, slot_date, start_time, end_time)
        .run();
    }
    return json({ data: { ok: true } });
  }

  if (request.method === "DELETE") {
    const member = url.searchParams.get("member");
    const date = url.searchParams.get("date");
    if (!member || !date)
      return json({ error: "member/date is required" }, 400);
    await env.DB.prepare("delete from slots where member = ? and slot_date = ?")
      .bind(member, date)
      .run();
    return json({ data: { ok: true } });
  }

  return json({ error: "Method not allowed" }, 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") return json({ ok: true });
    if (url.pathname === "/api/members") return handleMembers(request, env);
    if (url.pathname === "/api/slots") return handleSlots(request, env);

    return env.ASSETS.fetch(request);
  },
};
