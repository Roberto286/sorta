const core = importModule("core");

async function run() {
	const reminders = await Reminder.all();

	const remindersFromThreeMonths = core.discardRemindersPast3MonthFromNow(reminders)


	const availableLists = core.extractRemindersLists(remindersFromThreeMonths)

	console.log(availableLists)
}

await run()
