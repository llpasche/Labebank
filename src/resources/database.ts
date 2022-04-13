export enum Transaction {
  WITHDRAWAL = "Withdrawal",
  DEPOSIT = "Deposit",
}

export type teller = {
  transaction: Transaction;
  value: number;
  date: Date | string;
  description: string;
};

export type user = {
  name: string;
  CPF: string;
  birth: string;
  balance: number;
  extract: teller[];
};

export const users: user[] = [
  {
    name: "Lucas Pasche",
    CPF: "12345678901",
    birth: "07/06/1997",
    balance: 20500.0,
    extract: [
      {
        transaction: Transaction.DEPOSIT,
        value: 12700.0,
        date: "05/02/2022",
        description: "Salário.",
      },
      {
        transaction: Transaction.WITHDRAWAL,
        value: 200.0,
        date: "14/02/2022",
        description: "Curso de testes em JavaScript.",
      },
    ],
  },
  {
    name: "Nathália de Almeida",
    CPF: "37582903765",
    birth: "07/08/1998",
    balance: 31000.0,
    extract: [
      {
        transaction: Transaction.DEPOSIT,
        value: 6200.0,
        date: "05/02/2022",
        description: "Salário.",
      },
      {
        transaction: Transaction.WITHDRAWAL,
        value: 42.0,
        date: "22/02/2022",
        description: "Seguro do notebook.",
      },
    ],
  },
  {
    name: "Giovana Machado",
    CPF: "10293837465",
    birth: "10/11/1965",
    balance: 42000.0,
    extract: [
      {
        transaction: Transaction.DEPOSIT,
        value: 500.0,
        date: "02/02/2022",
        description: "Pensão.",
      },
      {
        transaction: Transaction.WITHDRAWAL,
        value: 400.0,
        date: "01/02/2022",
        description: "Plano de saúde.",
      },
    ],
  },
];
