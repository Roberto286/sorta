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
	list: ReturnType<typeof extractRemindersLists>[number];
	completed: boolean;
	reminders: Reminder[];
}) {
	return reminders.filter(
		(reminder) =>
			reminder.calendar.title === list && reminder.isCompleted === completed,
	);
}
