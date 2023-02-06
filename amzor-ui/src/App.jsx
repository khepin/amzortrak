import { For } from 'solid-js';
import orders from './orders-list';

function App() {
  return (
    <div>
      <p>
        <OrdersTable orders={orders} />
      </p>
    </div>
  );
}

function OrdersTable(props) {
  return <div>
    <table>
      <tbody>
        <tr>
          <th>Order ID</th>
          <th>Transactions</th>
          <th>Items</th>
        </tr>
        <For each={props.orders}>
          {(order, i) => <OrderRow order={order} index={i} />}
        </For>
      </tbody>
    </table>
  </div>;
}

function OrderRow(props) {
  const order = props.order
  return <tr>
    <td>
      <a href={order.url} target="_blank">{props.index} - {order.transactions[0].date}</a>
      <div><small>{order.order_id}</small></div>
    </td>
    <td>
      <For each={order.transactions}>
        {(transaction) => <div>{transaction.card} {transaction.amount} <div>&nbsp</div></div>}
      </For>
    </td>
    <td>
      <For each={order.items}>
        {(item) => <Item item={item} />}
      </For>
    </td>
  </tr>
}

function Item(props) {
  const item = props.item;
  return <div>
    {/* <img src={item.image_url} alt="" /> */}
    <a href={item.url} target="_blank">{item.name}</a>
    <div>&nbsp</div>
  </div>
}

export default App;
