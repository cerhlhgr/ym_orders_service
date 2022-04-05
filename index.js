const axios = require('axios')
const logger = require('./services/logger')
const appRoot = require('app-root-path');
const { existsSync, mkdirSync } = require("fs");
require("dotenv").config();
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const FormData = require('form-data');
const fs = require('fs/promises');

const TelegramBot = require('node-telegram-bot-api');

const cron = require('node-cron');

const google_sheets = require('./services/google_sheets')

let result_arr = []


async function formatingData(res, item)
{
    try
    {
        if(res && res.data && res.data.result && res.data.result.orders)
        {

            for(let j = 0;j <res.data.result.orders.length;j++)
            {
                const order = res.data.result.orders[j]

                for(let k = 0; k< order.items.length; k++)
                {
                    const itemin = order.items[k]

                    let total = -1

                    for(let pr = 0;pr <itemin.prices.length;pr++ )
                    {
                        const ik = itemin.prices[pr]

                        if(ik.type == "BUYER")
                        {
                            total = ik.total
                        }

                    }

                    const data = {
                        order_id:order.id,
                        shop_name:item.shop_name,
                        shop_client_id:item.client_id,
                        last_update_date:order.statusUpdateDate,
                        model:item.model,
                        create_date: order.creationDate,
                        status:order.status == "CANCELLED_BEFORE_PROCESSING" ? "заказ отменен до начала его обработки" : order.status == "CANCELLED_IN_DELIVERY" ? "заказ отменен во время его доставки" :
                            order.status == "CANCELLED_IN_PROCESSING" ? "заказ отменен во время его обработки" : order.status == "DELIVERY" ? "заказ передан службе доставки" :
                                order.status == "DELIVERED" ? "заказ доставлен" : order.status == "PARTIALLY_RETURNED" ? "заказ частично возвращен покупателем" : order.status == "PICKUP" ? "заказ доставлен в пункт выдачи" :
                                    order.status == "PROCESSING" ? "заказ в обработке" :  order.status == "REJECTED" ? "заказ создан, но не оплачен" : "неизвестный статус заказа",
                        offer_name:itemin.offerName,
                        market_sku:itemin.marketSku,
                        delivery_region:order.deliveryRegion.name,
                        payment_type:order.paymentType == "CREDIT" ? "заказ оформлен в кредит" : order.paymentType == "POSTPAID" ? "заказ оплачен после того, как был получен" : "заказ оплачен до того, как был получен",
                        count:itemin.count,
                        price:+total
                    }

                    await google_sheets.init(data)

                    result_arr.push({
                        order_id:order.id,
                        shop_name:item.shop_name,
                        shop_client_id:item.client_id,
                        last_update_date:order.statusUpdateDate,
                        model:item.model,
                        create_date: order.creationDate,
                        status:order.status == "CANCELLED_BEFORE_PROCESSING" ? "заказ отменен до начала его обработки" : order.status == "CANCELLED_IN_DELIVERY" ? "заказ отменен во время его доставки" :
                            order.status == "CANCELLED_IN_PROCESSING" ? "заказ отменен во время его обработки" : order.status == "DELIVERY" ? "заказ передан службе доставки" :
                                order.status == "DELIVERED" ? "заказ доставлен" : order.status == "PARTIALLY_RETURNED" ? "заказ частично возвращен покупателем" : order.status == "PICKUP" ? "заказ доставлен в пункт выдачи" :
                                    order.status == "PROCESSING" ? "заказ в обработке" :  order.status == "REJECTED" ? "заказ создан, но не оплачен" : "неизвестный статус заказа",
                        offer_name:itemin.offerName,
                        market_sku:itemin.marketSku,
                        delivery_region:order.deliveryRegion.name,
                        payment_type:order.paymentType == "CREDIT" ? "заказ оформлен в кредит" : order.paymentType == "POSTPAID" ? "заказ оплачен после того, как был получен" : "заказ оплачен до того, как был получен",
                        count:itemin.count,
                        price:+total
                    })
                }

            }
        }
    }
    catch(err)
    {
        await logger.error('formatingData - ' + err)
    }
}

async function csvFromat(data)
{
    try
    {
        const date  = new Date().toLocaleDateString()
        const path = `${appRoot}/results`

        if (!existsSync(path))
        {
            mkdirSync(path, { recursive: true });
        }
        const name = `result_${Math.floor(Math.random() * 100)}`

        const csvWriter = createCsvWriter({
            path: path+`/${name}.csv`,
            header: [
                {id: 'order_id', title: 'Номер заказа'},
                {id: 'shop_name', title: 'Название магазина'},
                {id: 'shop_client_id', title: 'client_id магазина'},
                {id: 'last_update_date', title: 'Последняя дата обновления статуса заказа'},
                {id: 'model', title: 'Модель подключения магазина'},
                {id: 'create_date', title: 'Дата создания магазина'},
                {id: 'status', title: 'Статус заказа'},
                {id: 'offer_name', title: 'Название заказа'},
                {id: 'market_sku', title: 'SKU в магазине'},
                {id: 'delivery_region', title: 'Регион доставки'},
                {id: 'payment_type', title: 'Тип оплаты'},
                {id: 'count', title: 'Количество'},
                {id: 'price', title: 'Цена'}
            ]
        });

        const res = await csvWriter.writeRecords(data)

        const bot = new TelegramBot(process.env.TELEGRAM_KEY_YA_ANALYTIC, {polling: false});

        await bot.sendDocument(process.env.CHAT_ID_YA_ANALYTIC,`${appRoot}/results/${name}.csv`,{
            caption:"@n_paleev"
        })
    }
    catch (err)
    {
        await logger.fatal('При записи файла произошла ошибка: ' + err)
        return false
    }
}

async function sleep(ms)
    {
        try
        {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            });
        }
        catch (err)
        {
            await logger.error("sleep - " + err )
        }
    }

async function getData()
{
    try
    {
        const request = await axios.get(`${process.env.DOMEN_YA_ANALYTIC}/api/parser/get`)
        return request
    }
    catch(err)
    {
        await logger.error("getData - " + err)
    }
}


async function init()
{

    try
    {
        const shops = await getData()
		
		console.log(shops.data)
        const sales = await getSales(shops.data)

        const sortResult = result_arr.sort((a,b) => {
            return new Date(b.last_update_date) - new Date(a.last_update_date )
        })

        await csvFromat(sortResult)
    }
    catch(err)
    {
        await logger.error("init - " + err)
    }
}

async function exec(item)
{
    try
    {

        const res = await axios.post(`https://api.partner.market.yandex.ru/v2/campaigns/${item.client_id}/stats/orders.json?limit=200&page_token=${item.page_token ? item.page_token : ''}`,
            {
                limit: 50,
            }, {
                headers: {
                    Authorization: 'OAuth oauth_token="' + item.token + '",  oauth_client_id="9d4f5befeb894689a92205896231f4f1"'
                }
            });

        await logger.info(`https://api.partner.market.yandex.ru/v2/campaigns/${item.client_id}/stats/orders.json?limit=200&page_token=${item.page_token ? item.page_token : ''}`)

        return res
    }
    catch(err)
    {
        await logger.error('exec - ' + err)
        return false
    }
}

async function getSales(data)
{
    try
    {

        for(let i = 0; i<data.length; i++)
        {

            const item = data[i]

            let res = await exec(item)

            if(!res)
            {
                await logger.error('Данные не удалось получить для магазина.')
                continue
            }

            await formatingData(res, item)

            while(res.data.length != 0 && res.data.result.paging && res.data.result.paging.nextPageToken)
            {
                item.page_token = res.data.result.paging.nextPageToken
                res = await exec(item)

                await formatingData(res, item)
                await sleep(2000)
            }

            await sleep(2000)
        }

    }
    catch(err)
    {
        await logger.error('getSales - ' + err)
    }

}

 const task = cron.schedule('0 */3 * * *', async () => {
     await init()

    await logger.info('cron закончил') 
	});
	
 




init()
