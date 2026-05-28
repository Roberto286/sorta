export type List = ReturnType<typeof extractRemindersLists>[number];

export function printReminders(reminders: Reminder[]) {
	for (const reminder of reminders) {
		console.log(reminder);
	}
}

export function discardRemindersPast3MonthsFromNow(reminders: Reminder[]) {
	const now = new Date();
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(now.getMonth() - 3);

	return reminders.filter((reminder) => {
		if (!reminder.creationDate) return false;

		const reminderCreationDate = new Date(reminder.creationDate);

		return (
			reminderCreationDate >= threeMonthsAgo && reminderCreationDate <= now
		);
	});
}

export function extractRemindersLists(reminders: Reminder[]) {
	const lists: Reminder["title"][] = [];
	for (const reminder of reminders) {
		if (lists.includes(reminder.calendar.title)) continue;

		lists.push(reminder.calendar.title);
	}
	return lists;
}

export function extractReminders({
	list,
	completed = false,
	reminders,
}: {
	list: List;
	completed: boolean;
	reminders: Reminder[];
}): Reminder[] {
	return reminders.filter(
		(reminder) =>
			reminder.calendar.title === list && reminder.isCompleted === completed,
	);
}

function mapPriority(priority: number | undefined): string {
	if (priority === undefined || priority === null) return "none";
	if (priority >= 1 && priority <= 4) return "high";
	if (priority === 5) return "medium";
	if (priority >= 6 && priority <= 9) return "low";
	return "none";
}

export function buildGeminiSystemPrompt(availableLists: List[]) {
	return `You are a task categorization assistant. You receive a JSON object containing a list of todo items and available reminder lists.
Your task:
1. Analyze each todo and assign it to the most appropriate list from the available ones.
2. Assign exactly the tags described below.
3. Fill in dueDate, notes, priority, and locationTrigger following the rules below.
4. Return ONLY a valid JSON object. No markdown, no explanations, no code blocks.
The output JSON object must have a single property "enrichedTodos" containing an array of objects with these exact fields:
- identifier: string (preserve from input)
- title: string (cleaned up, concise action)
- originalTitle: string (the exact original title from input, used to find the reminder in Shortcuts)
- list: string (must be one of the available lists)
- tags: string[] (tag set described below)
- dueDate: string (ISO 8601 date if the original reminder has a due date — you MUST preserve it. If missing but clearly deducible from the title, infer it. Otherwise empty string.)
- notes: string (improve or reorganize the original notes if any. If the title implies extra context worth noting, add it here. Otherwise empty string.)
- priority: string (one of: low, medium, high. Preserve the original priority if set. If not set, estimate based on urgency and importance.)
- locationTrigger: string (preserve the original location trigger if set, e.g. "when I arrive home". If the title implies a location context, infer a trigger. Otherwise empty string.)
Available lists: [${availableLists.join(", ")}]
Tag rules (produce exactly these tags, nothing else):
1. Time estimate tag: MUST be one of [10min, 20min, 30min]. Pick the one that best matches how long the task takes.
2. Phone tag: If the task can be done entirely from the phone, add "al-telefono". Otherwise omit it.
3. Do not add any other tags.
Additional rules:
- The user may dump tasks quickly. Look for implicit hints in the title itself (e.g. "comprare latte lavoro" should go to "Lavoro" list, "chiamare mamma telefono" should get "al-telefono" tag).
- Never invent new list names. If no list fits perfectly, pick the most generic one.
- Keep the original identifier unchanged.
- Clean up titles by removing filler words and fixing typos, but preserve the core meaning.
- Respond in the same language as the task titles.
Example output format: {"enrichedTodos": [{...}, {...}]}`;
}

export function buildGeminiPayload(
	reminders: Reminder[],
	availableLists: List[],
) {
	const todos = reminders.map((r) => ({
		identifier: r.identifier,
		title: r.title,
		originalTitle: r.title,
		notes: r.notes,
		creationDate: r.creationDate,
		dueDate: r.dueDate ? new Date(r.dueDate).toISOString() : undefined,
		priority: mapPriority(r.priority),
		locationTrigger: (r as Record<string, unknown>).location as
			| string
			| undefined,
	}));
	return {
		todos,
		availableLists,
	};
}

export function buildGeminiResponseSchema() {
	return {
		type: "object",
		properties: {
			enrichedTodos: {
				type: "array",
				items: {
					type: "object",
					properties: {
						identifier: { type: "string" },
						title: { type: "string" },
						originalTitle: { type: "string" },
						list: { type: "string" },
						tags: {
							type: "array",
							items: { type: "string" },
							description:
								"Must contain exactly 1 time estimate tag [10min, 20min, 30min] and optionally 'al-telefono' if the task is doable from the phone. No other tags allowed.",
						},
						dueDate: {
							type: "string",
							description:
								"ISO 8601 due date or empty string if not set/deducible.",
						},
						notes: {
							type: "string",
							description:
								"Improved or reorganized notes. Empty string if nothing useful.",
						},
						priority: {
							type: "string",
							enum: ["low", "medium", "high"],
							description:
								"Task priority. Preserve original if set, otherwise estimate.",
						},
						locationTrigger: {
							type: "string",
							description:
								"Location-based trigger phrase. Empty string if not set/deducible.",
						},
					},
					required: [
						"identifier",
						"title",
						"originalTitle",
						"list",
						"tags",
						"dueDate",
						"notes",
						"priority",
						"locationTrigger",
					],
				},
			},
		},
		required: ["enrichedTodos"],
	};
}
