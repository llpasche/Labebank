import { dateFormatter, ableToRegister } from "./resources/customTools";
import { teller, Transaction, user, users } from "./resources/database";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { AddressInfo } from "net";

const app: Express = express();

app.use(express.json());
app.use(cors());

//Get all users
app.get("/users", (req: Request, res: Response) => {
  try {
    if (users.length === 0) {
      throw new Error("No users registered.");
    } else {
      res.status(200).send(users);
    }
  } catch (error: any) {
    error.message === "No users registered."
      ? res.status(404).send(error.message)
      : res
          .status(500)
          .send("Unexpected error. Contact support for further information.");
  }
});

//Get balance
app.get("/users/balance", (req: Request, res: Response) => {
  try {
    const name = req.query.name as string;
    const cpf = req.headers.cpf as string;

    if (!name || !cpf) {
      throw new Error("Please fill in 'Name' or 'CPF' field.");
    }

    const formattedList = users.map((user) => {
      const newUser = {
        name: user.name.split(" ").join("-").toLowerCase(),
        CPF: user.CPF,
        balance: user.balance,
      };
      return newUser;
    });

    //User existance verification block
    const nameList = users.map((user) => {
      return user.name.split(" ").join("-").toLowerCase();
    });
    const cpfList = users.map((user) => {
      return user.CPF;
    });

    if (!nameList.includes(name) || !cpfList.includes(cpf)) {
      throw new Error("Name or CPF incorrect.");
    }

    for (let i = 0; i < formattedList.length; i++) {
      if (formattedList[i].name === name && formattedList[i].CPF === cpf) {
        res.send(`Balance: ${users[i].balance}`);
      }
    }
  } catch (error: any) {
    switch (error.message) {
      case "Please fill in 'Name' or 'CPF' field.":
        res.status(412).send(error.message);
        break;
      case "Name or CPF incorrect.":
        res.status(404).send(error.message);
        break;
      default:
        res
          .status(500)
          .send("Unexpected error. Contact support for further information.");
    }
  }
});

//Register an user
app.post("/users", (req: Request, res: Response) => {
  try {
    const newUser: user = {
      name: req.body.name,
      CPF: req.body.CPF,
      birth: req.body.birth,
      balance: 0,
      extract: [],
    };

    for (let user of users) {
      if (user.CPF === newUser.CPF) {
        throw new Error("CPF already registered.");
      }
    }

    if (!req.body.name || !req.body.CPF || !req.body.birth) {
      throw new Error("Please fill in all all fields.");
    }

    //Age verification...
    const birthArray: string[] = req.body.birth.split("/");
    const formattedBirthArray: string = dateFormatter(birthArray, 1, 0);
    const birthDate: number = new Date(formattedBirthArray).getTime();

    const isAble = ableToRegister(birthDate);

    if (!isAble) {
      throw new Error(
        "You must be at least 18 (eighteen) years old in order to create an account."
      );
    }

    users.push(newUser);
    res.status(201).send(users);
  } catch (error: any) {
    switch (error.message) {
      case "CPF already registered.":
        res.status(412).send(error.message);
        break;
      case "Please fill in all fields.":
        res.status(412).send(error.message);
        break;
      case "You must be at least 18 (eighteen) years old in order to create an account.":
        res.status(412).send(error.message);
      default:
        res
          .status(500)
          .send("Unexpected error. Contact support for further information.");
    }
  }
});

//Transfer between users
app.post("/users/transfer", (req: Request, res: Response) => {
  try {
    const myName = req.body.myName.split(" ").join("-").toLowerCase();
    const myCPF = req.body.myCPF;
    const recipientName = req.body.recipientName
      .split(" ")
      .join("-")
      .toLowerCase();
    const recipientCPF = req.body.recipientCPF;
    const value = req.body.value;
    const newTransfer: teller = {
      transaction: Transaction.WITHDRAWAL,
      value: value,
      date: new Date(Date.now()),
      description: "Money transfer.",
    };

    //Valid value verification block
    if (!value || value === 0) {
      throw new Error("Invalid value.");
    }

    //User existance verification block
    const nameList = users.map((user) => {
      return user.name.split(" ").join("-").toLowerCase();
    });
    const cpfList = users.map((user) => {
      return user.CPF;
    });

    if (
      !nameList.includes(myName) ||
      !nameList.includes(recipientName) ||
      !cpfList.includes(myCPF) ||
      !cpfList.includes(recipientCPF)
    ) {
      throw new Error("Name or CPF incorrect.");
    }

    //Valid balance verification block
    for (let i = 0; i < users.length; i++) {
      if (
        users[i].name.split(" ").join("-").toLowerCase() === myName &&
        users[i].CPF === myCPF &&
        users[i].balance < value
      ) {
        throw new Error("Insufficient balance.");
      }
    }

    //Sender extract update
    for (let i = 0; i < users.length; i++) {
      if (
        users[i].name.split(" ").join("-").toLowerCase() === myName &&
        users[i].CPF === myCPF
      ) {
        users[i].extract.push(newTransfer);
      }
    }

    //Recipient extract update
    for (let i = 0; i < users.length; i++) {
      if (
        users[i].name.split(" ").join("-").toLowerCase() === recipientName &&
        users[i].CPF === recipientCPF
      ) {
        users[i].extract.push({
          ...newTransfer,
          transaction: Transaction.DEPOSIT,
        });
      }
    }

    res.status(200).send(users);
  } catch (error: any) {
    switch (error.message) {
      case "Invalid value.":
        res.status(412).send(error.message);
        break;
      case "Name or CPF incorrect.":
        res.status(412).send(error.message);
        break;
      case "Insufficient balance.":
        res.status(412).send(error.message);
        break;
      default:
        res
          .status(500)
          .send("Unexpected error. Contact support for further information.");
    }
  }
});

//Add to balance
app.put("/users/:name/add-balance", (req: Request, res: Response) => {
  try {
    const name: string = req.params.name;
    const cpf: any = req.headers.cpf;
    const newValue: number = req.body.value;
    const newDeposit: teller = {
      transaction: Transaction.DEPOSIT,
      value: newValue,
      date: new Date(),
      description: "Money deposit.",
    };
    //Valid value verification
    if (newValue === 0) {
      throw new Error("You can't add '0' to your account.");
    }

    //User existance verification block
    const nameList = users.map((user) => {
      return user.name.split(" ").join("-").toLowerCase();
    });
    const cpfList = users.map((user) => {
      return user.CPF;
    });
    if (!nameList.includes(name) || !cpfList.includes(cpf)) {
      throw new Error("Name or CPF incorrect.");
    }

    for (let i = 0; i < users.length; i++) {
      if (nameList[i] === name && cpfList[i] === cpf) {
        users[i].balance += newValue;
        users[i].extract.push(newDeposit);
        res.send(`New balance: ${users[i].balance}`);
      }
    }
  } catch (error: any) {
    switch (error.message) {
      case "You can't add '0' to your account.":
        res.status(412).send(error.message);
        break;
      case "Name or CPF incorrect.":
        res.status(404).send(error.message);
      default:
        res
          .status(500)
          .send("Unexpected error. Contact support for further information.");
    }
  }
});

//Add bills
app.post("/users/:name/add-bill", (req: Request, res: Response) => {
  //DATE FORMAT: YYYY-DD-MM
  try {
    const name: string = req.params.name;
    const cpf: any = req.headers.cpf;
    const billValue: number = req.body.value;
    const newBill: teller = {
      transaction: Transaction.WITHDRAWAL,
      value: billValue,
      date: new Date(req.body.date),
      description: req.body.description,
    };
    //Valid body verification block
    if (!billValue || !newBill.description) {
      throw new Error("Please inform value and desription.");
    }

    //Valid date verification block
    if (!req.body.date) {
      newBill.date = new Date(Date.now());
    }

    if (new Date(newBill.date) < new Date(Date.now())) {
      throw new Error(
        "Please insert a valid date for your transaction. You can't pay anything in the past!"
      );
    }
    //Valid value verification block
    if (billValue === 0) {
      throw new Error("You can't pay '0' from your account.");
    }

    //User existance verification block
    const nameList = users.map((user) => {
      return user.name.split(" ").join("-").toLowerCase();
    });
    const cpfList = users.map((user) => {
      return user.CPF;
    });
    if (!nameList.includes(name) || !cpfList.includes(cpf)) {
      throw new Error("Name or CPF incorrect.");
    }

    for (let i = 0; i < users.length; i++) {
      if (nameList[i] === name && cpfList[i] === cpf) {
        if (newBill.value <= users[i].balance) {
          users[i].extract.push(newBill);
          const message = "Extract: ";
          res.status(201).send(users[i].extract);
        } else {
          throw new Error("Insufficient balance.");
        }
      }
    }
  } catch (error: any) {
    switch (error.message) {
      case "You can't pay '0' from your account.":
        res.status(412).send(error.message);
        break;
      case "Name or CPF incorrect.":
        res.status(404).send(error.message);
        break;
      case "Please insert a valid date for your transaction. You can't pay anything in the past!":
        res.status(412).send(error.message);
        break;
      case "Insufficient balance.":
        res.status(412).send(error.message);
        break;
      case "Please inform value and desription.":
        res.status(412).send(error.message);
      default:
        res
          .status(500)
          .send("Unexpected error. Contact support for further information.");
    }
  }
});

//Update balance
app.put("/users/:name/update-balance", (req: Request, res: Response) => {
  try {
    const name: string = req.params.name;
    const cpf: any = req.headers.cpf;

    //User existance verification block
    const nameList = users.map((user) => {
      return user.name.split(" ").join("-").toLowerCase();
    });
    const cpfList = users.map((user) => {
      return user.CPF;
    });
    if (!nameList.includes(name) || !cpfList.includes(cpf)) {
      throw new Error("Name or CPF incorrect.");
    }

    for (let i = 0; i < users.length; i++) {
      if (nameList[i] === name && cpfList[i] === cpf) {
        for (let j = 0; j < users[i].extract.length; j++)
          if (
            users[i].extract[j].transaction === Transaction.WITHDRAWAL &&
            users[i].extract[j].value <= users[i].balance &&
            new Date(users[i].extract[j].date) < new Date(Date.now())
          ) {
            users[i].balance -= users[i].extract[j].value;

            res
              .status(201)
              .send(`Balance updated! You have ${users[i].balance} left.`);
          } else if (
            users[i].extract[j].transaction === Transaction.DEPOSIT &&
            new Date(users[i].extract[j].date) < new Date(Date.now())
          ) {
            users[i].balance += users[i].extract[j].value;

            res
              .status(201)
              .send(`Balance updated! You have ${users[i].balance} left.`);
          }
      }
    }
  } catch (error: any) {
    switch (error.message) {
      case "You can't pay '0' from your account.":
        res.status(412).send(error.message);
        break;
      case "Name or CPF incorrect.":
        res.status(404).send(error.message);
        break;
      case "Please insert a valid date for your transaction. You can't pay anything in the past!":
        res.status(412).send(error.message);
        break;
      case "Insufficient balance.":
        res.status(412).send(error.message);
        break;
      case "Please inform value and desription.":
        res.status(412).send(error.message);
      default:
        res
          .status(500)
          .send("Unexpected error. Contact support for further information.");
    }
  }
});

const server = app.listen(process.env.PORT || 3003, () => {
  if (server) {
    const address = server.address() as AddressInfo;
    console.log(`Server is running in http://localhost:${address.port}`);
  } else {
    console.error(`Failure upon starting server.`);
  }
});
