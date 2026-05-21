import * as core from "../core/core.ts";

async function run() {
	const reminders = await Reminder.all();

	const remindersFromThreeMonths =
		core.discardRemindersPast3MonthsFromNow(reminders);

	const availableLists = core.extractRemindersLists(remindersFromThreeMonths);

	const remindersInInbox = core.extractReminders({
		list: "Inbox",
		completed: false,
		reminders,
	});

	console.log(remindersInInbox);
}

await run();
