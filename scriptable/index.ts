import * as core from "../core/core.ts";

type ShortcutInput = {
	apiKey?: string;
	model?: string;
};

const DEFAULT_MODEL = "gemini-2.5-flash";

function getShortcutInput(): ShortcutInput | undefined {
	return args.shortcutParameter as ShortcutInput | undefined;
}

async function sendErrorNotification(message: string) {
	const notification = new Notification();
	notification.title = "Sorta Error";
	notification.body = message;
	await notification.schedule();
}

async function callGemini(
	apiKey: string,
	model: string,
	reminders: Reminder[],
	availableLists: core.List[],
) {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

	const systemPrompt = core.buildGeminiSystemPrompt(availableLists);
	const userPayload = core.buildGeminiPayload(reminders, availableLists);

	const req = new Request(url);
	req.method = "POST";
	req.headers = {
		"Content-Type": "application/json",
	};
	req.body = JSON.stringify({
		systemInstruction: {
			parts: [{ text: systemPrompt }],
		},
		contents: [
			{
				parts: [{ text: JSON.stringify(userPayload) }],
			},
		],
		generationConfig: {
			responseMimeType: "application/json",
			responseSchema: core.buildGeminiResponseSchema(),
		},
	});

	const response = await req.loadJSON();
	return response;
}

function parseGeminiResponse(response: unknown): unknown[] {
	if (!response || typeof response !== "object") {
		throw new Error(
			`Invalid Gemini response: not an object. Got: ${JSON.stringify(response)}`,
		);
	}

	const responseObj = response as Record<string, unknown>;

	// Check for API error responses first
	if (responseObj.error) {
		const error = responseObj.error as Record<string, unknown>;
		const errorMessage = error.message || error.status || JSON.stringify(error);
		throw new Error(`Gemini API error: ${errorMessage}`);
	}

	const candidates = responseObj.candidates;
	if (!Array.isArray(candidates) || candidates.length === 0) {
		throw new Error(
			`Invalid Gemini response: no candidates. Full response: ${JSON.stringify(response)}`,
		);
	}

	const content = (candidates[0] as Record<string, unknown>).content;
	if (!content || typeof content !== "object") {
		throw new Error("Invalid Gemini response: no content");
	}

	const parts = (content as Record<string, unknown>).parts;
	if (!Array.isArray(parts) || parts.length === 0) {
		throw new Error("Invalid Gemini response: no parts");
	}

	const text = (parts[0] as Record<string, unknown>).text;
	if (typeof text !== "string") {
		throw new Error("Invalid Gemini response: text is not a string");
	}

	return JSON.parse(text);
}

async function run() {
	const input = getShortcutInput();
	const apiKey = input?.apiKey;
	const model = input?.model || DEFAULT_MODEL;

	if (!apiKey) {
		await sendErrorNotification(
			"Missing Gemini API key. Pass it via Shortcut parameter 'apiKey'.",
		);
		Script.setShortcutOutput(null);
		return;
	}

	try {
		const reminders = await Reminder.all();
		const remindersFromThreeMonths =
			core.discardRemindersPast3MonthsFromNow(reminders);
		const availableLists = core.extractRemindersLists(remindersFromThreeMonths);
		const remindersInInbox = core.extractReminders({
			list: "Inbox",
			completed: false,
			reminders: remindersFromThreeMonths,
		});

		if (remindersInInbox.length === 0) {
			Script.setShortcutOutput(JSON.stringify([]));
			return;
		}

		const response = await callGemini(
			apiKey,
			model,
			remindersInInbox,
			availableLists,
		);
		const enriched = parseGeminiResponse(response);
		Script.setShortcutOutput(JSON.stringify(enriched));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		await sendErrorNotification(`Sorta failed: ${message}`);
		Script.setShortcutOutput(null);
	}
}

await run();
Script.complete();
