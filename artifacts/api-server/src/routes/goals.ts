import { Router, type IRouter } from "express";
import { db, goalsTable, goalUpdatesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  ListGoalsQueryParams,
  CreateGoalBody,
  GetGoalParams,
  UpdateGoalBody,
  UpdateGoalParams,
  ListGoalUpdatesParams,
  CreateGoalUpdateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/goals", async (req, res) => {
  try {
    const query = ListGoalsQueryParams.safeParse(req.query);
    const category = query.success ? query.data.category : undefined;
    const city = query.success ? query.data.city : undefined;

    let conditions = [];
    if (category) conditions.push(eq(goalsTable.category, category));
    if (city) conditions.push(eq(goalsTable.city, city));

    const goalsWithUsers = await db
      .select({
        id: goalsTable.id,
        userId: goalsTable.userId,
        title: goalsTable.title,
        description: goalsTable.description,
        category: goalsTable.category,
        city: goalsTable.city,
        status: goalsTable.status,
        createdAt: goalsTable.createdAt,
        updatedAt: goalsTable.updatedAt,
        authorName: usersTable.firstName,
        authorImage: usersTable.profileImageUrl,
      })
      .from(goalsTable)
      .leftJoin(usersTable, eq(goalsTable.userId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(goalsTable.createdAt));

    res.json({ goals: goalsWithUsers });
  } catch (err) {
    req.log.error({ err }, "Failed to list goals");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/goals/mine", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const goalsWithUsers = await db
      .select({
        id: goalsTable.id,
        userId: goalsTable.userId,
        title: goalsTable.title,
        description: goalsTable.description,
        category: goalsTable.category,
        city: goalsTable.city,
        status: goalsTable.status,
        createdAt: goalsTable.createdAt,
        updatedAt: goalsTable.updatedAt,
        authorName: usersTable.firstName,
        authorImage: usersTable.profileImageUrl,
      })
      .from(goalsTable)
      .leftJoin(usersTable, eq(goalsTable.userId, usersTable.id))
      .where(eq(goalsTable.userId, req.user.id))
      .orderBy(desc(goalsTable.createdAt));

    res.json({ goals: goalsWithUsers });
  } catch (err) {
    req.log.error({ err }, "Failed to list user goals");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/goals", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [goal] = await db
      .insert(goalsTable)
      .values({
        userId: req.user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? "",
        category: parsed.data.category,
        city: parsed.data.city ?? "Cleveland",
        status: "in_progress",
      })
      .returning();

    res.status(201).json({ goal: { ...goal, authorName: req.user.firstName, authorImage: req.user.profileImageUrl } });
  } catch (err) {
    req.log.error({ err }, "Failed to create goal");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/goals/:id", async (req, res) => {
  const parsed = GetGoalParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid goal ID" });
    return;
  }

  try {
    const [goalRow] = await db
      .select({
        id: goalsTable.id,
        userId: goalsTable.userId,
        title: goalsTable.title,
        description: goalsTable.description,
        category: goalsTable.category,
        city: goalsTable.city,
        status: goalsTable.status,
        createdAt: goalsTable.createdAt,
        updatedAt: goalsTable.updatedAt,
        authorName: usersTable.firstName,
        authorImage: usersTable.profileImageUrl,
      })
      .from(goalsTable)
      .leftJoin(usersTable, eq(goalsTable.userId, usersTable.id))
      .where(eq(goalsTable.id, parsed.data.id));

    if (!goalRow) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    const updates = await db
      .select({
        id: goalUpdatesTable.id,
        goalId: goalUpdatesTable.goalId,
        userId: goalUpdatesTable.userId,
        content: goalUpdatesTable.content,
        createdAt: goalUpdatesTable.createdAt,
        authorName: usersTable.firstName,
        authorImage: usersTable.profileImageUrl,
      })
      .from(goalUpdatesTable)
      .leftJoin(usersTable, eq(goalUpdatesTable.userId, usersTable.id))
      .where(eq(goalUpdatesTable.goalId, parsed.data.id))
      .orderBy(desc(goalUpdatesTable.createdAt));

    res.json({ goal: goalRow, updates });
  } catch (err) {
    req.log.error({ err }, "Failed to get goal");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/goals/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const paramsParsed = UpdateGoalParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid goal ID" });
    return;
  }

  const bodyParsed = UpdateGoalBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(goalsTable)
      .where(and(eq(goalsTable.id, paramsParsed.data.id), eq(goalsTable.userId, req.user.id)));

    if (!existing) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    const updateValues: Partial<typeof goalsTable.$inferInsert> = {};
    if (bodyParsed.data.status) updateValues.status = bodyParsed.data.status;
    if (bodyParsed.data.title) updateValues.title = bodyParsed.data.title;
    if (bodyParsed.data.description) updateValues.description = bodyParsed.data.description;

    const [updated] = await db
      .update(goalsTable)
      .set(updateValues)
      .where(eq(goalsTable.id, paramsParsed.data.id))
      .returning();

    res.json({ goal: { ...updated, authorName: req.user.firstName, authorImage: req.user.profileImageUrl } });
  } catch (err) {
    req.log.error({ err }, "Failed to update goal");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/goals/:id/updates", async (req, res) => {
  const parsed = ListGoalUpdatesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid goal ID" });
    return;
  }

  try {
    const updates = await db
      .select({
        id: goalUpdatesTable.id,
        goalId: goalUpdatesTable.goalId,
        userId: goalUpdatesTable.userId,
        content: goalUpdatesTable.content,
        createdAt: goalUpdatesTable.createdAt,
        authorName: usersTable.firstName,
        authorImage: usersTable.profileImageUrl,
      })
      .from(goalUpdatesTable)
      .leftJoin(usersTable, eq(goalUpdatesTable.userId, usersTable.id))
      .where(eq(goalUpdatesTable.goalId, parsed.data.id))
      .orderBy(desc(goalUpdatesTable.createdAt));

    res.json({ updates });
  } catch (err) {
    req.log.error({ err }, "Failed to list goal updates");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/goals/:id/updates", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateGoalUpdateParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid goal ID" });
    return;
  }

  const { content } = req.body;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  try {
    const [goalRow] = await db
      .select()
      .from(goalsTable)
      .where(eq(goalsTable.id, parsed.data.id));

    if (!goalRow) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    const [update] = await db
      .insert(goalUpdatesTable)
      .values({
        goalId: parsed.data.id,
        userId: req.user.id,
        content: content.trim(),
      })
      .returning();

    res.status(201).json({
      update: {
        ...update,
        authorName: req.user.firstName,
        authorImage: req.user.profileImageUrl,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create goal update");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
