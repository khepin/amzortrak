import { ClientFunction, Selector } from 'testcafe';
const fs = require('fs');
const prompt = require('prompt');

fixture('Getting Started')
    .skipJsErrors()
    .page('https://www.amazon.com/gp/css/order-history');

const getPageUrl = ClientFunction(() => window.location.href);
function sleep(n) {
    return new Promise(resolve => setTimeout(resolve, n * 1_000))
}

let allOrders = [];

test('My first test', async t => {
    await login(t);
    await handleOrderPage(t);
    for (let i = 1; i < 20; i++) {
        let hasNextPage = await Selector('ul.a-pagination .a-last a').exists;
        if (!hasNextPage) {
            break;
        }
        await t.click('ul.a-pagination .a-last a');
        await handleOrderPage(t);
    }
    console.log(allOrders);

    fs.writeFileSync('orders.json', JSON.stringify(allOrders));
});

async function login(t) {
    let email = process.env.AMZ_EMAIL;
    let pwd = process.env.AMZ_PWD;
    console.log(email)
    var schema = {
        properties: {

        }
    };
    let doprompt = false;
    if (!email) {
        schema.properties.email = { required: true };
        doprompt = true;
    }
    if (!pwd) {
        schema.properties.pwd = { required: true, hidden: true };
        doprompt = true;
    }
    if (doprompt) {
        prompt.start();
        const r = await prompt.get(schema)
        email = email || r.email;
        pwd = pwd || r.pwd;
    }


    await t.typeText('#ap_email', email);
    await t.click('#continue');
    await t.typeText('#ap_password', pwd);
    await t.click('#signInSubmit');
}

async function handleOrder(t) {
    let hasTransactions = await Selector('#orderDetails a.a-link-expander').exists;
    if (!hasTransactions) {
        return;
    }
    await t.click('#orderDetails a.a-link-expander');
    let order = {};
    const orderId = (await Selector('.order-date-invoice-item').nth(1).textContent).replace('Order#', '').trim();
    order.order_id = orderId;
    order.transactions = [];
    const transactionNodes = (await Selector('div.a-expander-content-expanded span').withText('$'))
    for (let i = 0; i < await transactionNodes.count; i++) {
        let transactionText = await transactionNodes.nth(i).textContent;
        let transaction = transactionText.split('\n').map(s => s.trim()).filter(n => n).filter(n => n !== '-');
        order.transactions.push({
            date: transaction[0],
            card: transaction[1],
            amount: transaction[2],
        });
    }
    order.url = await getPageUrl()
    const links = await Selector('#orderDetails a').withAttribute('href');
    const linkcounts = await links.count;
    let items = [];
    for (let i = 0; i < linkcounts; i++) {
        let attrs = await links.nth(i).attributes;
        let href = attrs.href
        if (!href) {
            return;
        }
        let foundItems = 0;
        if (href.includes('/gp/product')) {
            let lnk = (await links.nth(i).textContent).trim();
            if (lnk !== '') {
                items.push({
                    name: lnk,
                    url: 'https://www.amazon.com' + (await links.nth(i).attributes).href,
                    image_url: (await Selector('img.yo-critical-feature').nth(foundItems).attributes).src.replace(/\d+_.jpg/, '1000_.jpg'),
                });
                foundItems++;
            }
        }
    }
    order.items = items.filter(n => n);
    allOrders.push(order);
    console.log('current orders count:', allOrders.length);
}

async function handleOrderPage(t) {
    const orderCards = await Selector('.js-order-card');
    const cardCount = await orderCards.count;
    const pageUrl = await getPageUrl();
    for (let i = 0; i < cardCount; i++) {
        await t.click(orderCards.nth(i).find('.yohtmlc-order-details-link'));
        await handleOrder(t);
        await t.navigateTo(pageUrl)
    }
}
