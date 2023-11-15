const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const middy = require('@middy/core');
const jsonBodyParser = require('@middy/http-json-body-parser');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const getAll = async () => {
  let todos = [];
  try {
    const results = await dynamoDB
      .scan({
        TableName: 'TodoTable',
      })
      .promise();
    todos = results.Items;

    return {
      statusCode: 200,
      body: JSON.stringify(todos),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Something went wrong!',
    };
  }
};

const getOne = async (event) => {
  let todo = null;
  const { id } = event.pathParameters;

  try {
    const result = await dynamoDB
      .get({
        TableName: 'TodoTable',
        Key: { id },
      })
      .promise();
    todo = result.Item;

    return {
      statusCode: 200,
      body: JSON.stringify(todo),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Something went wrong!',
    };
  }
};

const add = async (event) => {
  const { todo } = event.body;
  const createdAt = new Date().toISOString();
  const id = uuidv4();

  const newTodo = {
    id,
    todo,
    createdAt,
    completed: false,
  };

  try {
    await dynamoDB
      .put({
        TableName: 'TodoTable',
        Item: newTodo,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify(newTodo),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Something went wrong!',
    };
  }
};

const update = async (event) => {
  const { id } = event.pathParameters;
  const { completed } = event.body;

  try {
    await dynamoDB
      .update({
        TableName: 'TodoTable',
        Key: { id },
        UpdateExpression: 'set completed = :completed',
        ExpressionAttributeValues: {
          ':completed': completed,
        },
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    return {
      statusCode: 200,
      body: 'Todo updated.',
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Something went wrong!',
    };
  }
};

module.exports = {
  getAll,
  getOne,
  add: middy(add).use(jsonBodyParser()),
  update: middy(update).use(jsonBodyParser()),
};
