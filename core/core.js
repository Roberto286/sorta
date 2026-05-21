function printReminders(reminders) {
	for (const reminder of reminders) {
		console.log(reminder);
	}
}

function discardRemindersPast3MonthFromNow(reminders) {
	const now = new Date();
	const threeMontsAgo = new Date().setMonth(now.getMonth() - 3);

	return reminders.filter((reminder) => {
		const reminderCreationDate = new Date(reminder.creationDate);

		return reminderCreationDate >= threeMontsAgo;
	});
}

function extractRemindersLists(reminders) {
	const lists = [];
	for (const reminder of reminders) {
		if (lists.includes(reminder.calendar.title)) continue;

		lists.push(reminder.calendar.title);
	}
	return lists;
}

module.exports = {
	printReminders,
	discardRemindersPast3MonthFromNow,
	extractRemindersLists,
};
