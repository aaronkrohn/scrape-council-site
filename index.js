'use strict'
const express = require('express')
const puppeteer = require('puppeteer')
const morgan = require("morgan")
// const chrome = require('chrome-aws-lambda')
// require AWS plugin
const awsPlugin = require('puppeteer-extra-plugin-aws');
// add AWS plugin


const PORT = 8080
const app = express()

app.use(morgan("dev"))

const SAVE = {
    nextDate: null,
}

app.get('/date', async (req, res) => {
    const getTagContent = async (page, selector) => {
        const element = await page.$(selector)
        const text = await (await element.getProperty('textContent')).jsonValue()

        return text
    }
    const getWebDataV2 = async () => {
        puppeteer.use(awsPlugin());
        const browser = await puppeteer.launch()
        //     {
        //     args: chrome.args,
        //     executablePath: await chrome.executablePath,
        //     headless: true,
        // }
        // )

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

        await browser.close()
        return nextBinDate
    }


    if (SAVE.nextDate === null) {
        const text = await getWebDataV2()

        SAVE.nextDate = text

        await res.json({ body: text })
    } else {
        await res.json({ body: SAVE.nextDate })
    }
})

app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`)
})
