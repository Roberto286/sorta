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
2. Assign exactly the tags described below.
3. Return ONLY a valid JSON object. No markdown, no explanations, no code blocks.
The output JSON object must have a single property "enrichedTodos" containing an array of objects with these exact fields:
- identifier: string (preserve from input)
- title: string (cleaned up, concise action)
- list: string (must be one of the available lists)
- tags: string[] (tag set described below)
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
					description:
						"Must contain exactly 1 time estimate tag [10min, 20min, 30min] and optionally 'al-telefono' if the task is doable from the phone. No other tags allowed.",
				},
			},
			required: ["identifier", "title", "list", "tags"],
		},
	};
}
