const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const customers = [];

//middleware
function verifyIfExistsAccountCpf(request, response, next) {
    const { cpf } = request.headers;


    const customer = customers.find((customer) => customer.cpf == cpf);
    if (!customer) {
        return response.status(400).json({ error: "Customer not found" })
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce(
        (acc, operator) => {
            if (operator.type === 'credit') {
                return acc + operator.amount;
            } else {
                return acc - operator.amount;
            }
        }, 0
    );
    return balance;
}

/**
 * cpf string 
 * name  string 
 * id - uuid
 * statement - []
 */
app.use(express.json());

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );
    if (customerAlreadyExists) {
        return response.status(400).json({ error: "Customer alredy exists!" })
    }


    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return response.status(201).send();
})

app.get("/statement", verifyIfExistsAccountCpf, (request, response) => {
    const { customer } = request;
    return response.status(200).json(customer.statement);
})

app.post("/deposit", verifyIfExistsAccountCpf, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);
    return response.status(201).send();
})

app.post("/withdraw", verifyIfExistsAccountCpf, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement)

    if (balance < amount) {
        return response.status(400).json({ error: "insufficient funds!" })
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send()
})

app.get("/statement/date", verifyIfExistsAccountCpf, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        statement => statement.created_at.toDateString() == new Date(dateFormat).toDateString())


    return response.status(200).json(statement);
})

app.put("/account/", verifyIfExistsAccountCpf, (request, response)=>{
    const { name } = request.body;
    const {customer } = request;
    customer.name = name;

    response.status(201).send();
})

app.listen(3333);