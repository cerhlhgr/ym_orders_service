const fs = require("fs")

const {google} = require('googleapis')
const {GoogleAuth} = require('google-auth-library')

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

const logger = require('./logger')


class google_sheets_class
{

    async init(data)
    {
        try {
            const auth = new GoogleAuth({
                keyFile: "./credentials.json",
                "scopes": SCOPES
            })

            const client = await auth.getClient()

            const sheets = google.sheets({version: "v4", auth: client})


            const getRows = await sheets.spreadsheets.values.get({
                auth,
                spreadsheetId: "1_p4emN3pwCOVPIWtdo0c9jQQSQOs5fPrLANQznegoK4",
                range: "A2:M"
            })

            let flag = false

            if (getRows.data.values && getRows.data.values.length > 0) {
                for (let i = 0; i < getRows.data.values.length; i++) {
                    const item = getRows.data.values[i]

                    if (getRows.data.values[i][0] && getRows.data.values[i][0] == data.order_id && getRows.data.values[i][1] == data.shop_name && getRows.data.values[i][7] == data.offer_name) {
                        await logger.warn('Обновляю данные на: ' + "A" + (i+2) + ":M" + (i+2))
                        const pos = i

                        let arr = []

                        for (let key in data) {
                            arr.push(data[key])
                        }

                        const range = "A" + (i + 2) + ":M" + (i + 2)

                        await sheets.spreadsheets.values.update({
                            auth,
                            spreadsheetId: "1_p4emN3pwCOVPIWtdo0c9jQQSQOs5fPrLANQznegoK4",
                            range: range,
                            valueInputOption: "USER_ENTERED",
                            resource: {
                                values: [arr]
                            }

                        })

                        flag = true
                        return
                    }

                }
            }


            if (!flag)
            {
                let arr_app = []

                for (let key in data) {
                    arr_app.push(data[key])
                }

                await logger.warn('Добавляю данные.')

                await sheets.spreadsheets.values.append({
                        auth,
                        spreadsheetId: "1_p4emN3pwCOVPIWtdo0c9jQQSQOs5fPrLANQznegoK4",
                        range: "A1:M",
                        valueInputOption: "USER_ENTERED",
                        resource:
                            {
                                values: [arr_app]
                            }
                    }
                )

                return
            }
        }
        catch (err) {
            await logger.error('init - ' + err)
        }
    }
}



module.exports = new google_sheets_class()