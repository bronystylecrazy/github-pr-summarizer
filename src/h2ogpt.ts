import puppeteer from "puppeteer";

export async function h2ogpt(prompt: string) {
  (async () => {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();

    await page.goto("https://codellama.h2o.ai"); // Sneaky visit to ChatGPT's domain

    // Now, let's fill in the prompt (assuming a form, for simplicity)
    const promptSelector = "#prompt-form textarea"; // You gotta find the actual selector
    await page.type(promptSelector, prompt);
    await page.keyboard.press("Enter"); // Assuming the form submits on Enter

    // And... let's hit that submit button (if there is one)
    const submitButtonSelector = "#submit-button"; // Replace with the actual selector
    await page.click(submitButtonSelector);

    // Let's just wait for the magic to happen
    await page.waitForTimeout(5000); // 5 seconds for a burst of wisdom

    // Now, you might want to grab the result or do something with it
    // const result = await page.$eval('#result-container', (el) => el.innerText);
    // console.log(result);

    // Close the browser when done
    await browser.close();
  })();
}
