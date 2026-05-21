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

export function buildSystemPrompt({
	taskToMove,
	availableLists,
}: {
	taskToMove: Reminder;
	availableLists: List[];
}) {
	return `
	You are a task categorization assistant. Analyze the task and return ONLY a 
single line in this exact format, nothing else:

LIST: <list name> | TITLE: <cleaned task title>

Rules:
- LIST must be one of the following (pick the best match, never invent new ones):
[${availableLists.join(", ")}]

- TITLE: rewrite the task as a clean, concise action (remove filler words, fix typos)
- If no list matches, use the most generic one available
- Respond in the same language as the task

Task to analyze:
[${taskToMove.title}]
`;
}
