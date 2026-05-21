import * as core from "../core/core.ts";

type Prompt = ReturnType<typeof core.buildSystemPrompt>;

const shortcutInput = args.shortcutParameter;

async function step1() {
	const reminders = await Reminder.all();

	const remindersFromThreeMonths =
		core.discardRemindersPast3MonthsFromNow(reminders);

	const availableLists = core.extractRemindersLists(remindersFromThreeMonths);

	const remindersInInbox = core.extractReminders({
		list: "Inbox",
		completed: false,
		reminders,
	});

	const prompts: Prompt[] = [];
	for (const reminder of remindersInInbox) {
		const prompt = core.buildSystemPrompt({
			taskToMove: reminder,
			availableLists,
		});

		prompts.push(prompt);
	}

	Script.setShortcutOutput(prompts);
}

async function step2(prompt: Prompt) {
	console.log(`Siamo in step2 con i prompt!!: ${prompt}`);
	const alert = new Alert();
	alert.title = `Siamo in step2 con i prompt!!: ${prompt}`;
	await alert.present();
}

async function run() {
	if (!shortcutInput) return;

	switch (+shortcutInput.currentStep) {
		case 1:
			await step1();
			break;

		case 2:
			await step2(shortcutInput.input);
			break;

		default:
			break;
	}
}

await run();
Script.complete();
