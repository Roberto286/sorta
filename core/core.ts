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

export function buildGeminiSystemPrompt(availableLists: List[]) {
	return `You are a task categorization assistant. You receive a JSON object containing a list of todo items and available reminder lists.

Your task:
1. Analyze each todo and assign it to the most appropriate list from the available ones.
2. Assign relevant tags to each todo.
3. Return ONLY a valid JSON array. No markdown, no explanations, no code blocks.

The output JSON array must contain objects with these exact fields:
- identifier: string (preserve from input)
- title: string (cleaned up, concise action)
- list: string (must be one of the available lists)
- tags: string[] (relevant tags)

Available lists: [${availableLists.join(", ")}]

Rules:
- Never invent new list names. If no list fits perfectly, pick the most generic one.
- Tags should be lowercase, single words or short phrases.
- Keep the original identifier unchanged.
- Clean up titles by removing filler words and fixing typos.
- Respond in the same language as the task titles.`;
}

export function buildGeminiPayload(
	reminders: Reminder[],
	availableLists: List[],
) {
	const todos = reminders.map((r) => ({
		identifier: r.identifier,
		title: r.title,
		notes: r.notes,
		creationDate: r.creationDate,
	}));
	return {
		todos,
		availableLists,
	};
}

export function buildGeminiResponseSchema() {
	return {
		type: "array",
		items: {
			type: "object",
			properties: {
				identifier: { type: "string" },
				title: { type: "string" },
				list: { type: "string" },
				tags: {
					type: "array",
					items: { type: "string" },
				},
			},
			required: ["identifier", "title", "list", "tags"],
		},
	};
}
