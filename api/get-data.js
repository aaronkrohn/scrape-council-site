const puppeteer = require('puppeteer')
const chrome = require('chrome-aws-lambda')

module.exports = async (req, res) => {
    const getTagContent = async (page, selector) => {
        const element = await page.$(selector)
        const text = await (await element.getProperty('textContent')).jsonValue()

        return text
    }
    const getWebDataV2 = async () => {
        const browser = await puppeteer.launch({
            args: chrome.args,
            executablePath: await chrome.executablePath,
            headless: chrome.headless,
        })
        const page = await browser.newPage()
        await page.goto('http://www.southkesteven.gov.uk/index.aspx?articleid=8930', { waitUntil: 'networkidle2' })

        await page.waitFor('input[name=q]')
        await page.$eval('input[name=q]', el => el.value = 'ng31 7wn')

        await page.click(".subform button, input[type='submit']")

        await page.waitForSelector('.delta select[name=address]')
        const option = (await page.$x(
            '//*[@id = "address"]/option[text() = "79 79  BRADLEY DRIVE  GRANTHAM  NG31 7WN"]',
        ))[0]
        const value = await (await option.getProperty('value')).jsonValue()
        await page.select('.delta select[name=address]', value)

        await page.click(".delta button[type='submit']")
        await page.waitForSelector('.alert.icon--bin')

        const nextBinDate = await getTagContent(page, '.alert__heading.alpha')
        const colorBinInfo = await getTagContent(page, 'aside.alert.icon--bin > p:nth-child(2)')


        await browser.close()
        return { nextBinDate, colorBinInfo }
    }

    const { nextBinDate, colorBinInfo } = await getWebDataV2()


    res.json({
        colorBinInfo,
        nextBinDate,
    })
}
