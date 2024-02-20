import createPrompt from "prompt-sync";
import fs from "node:fs/promises";
let prompt=new createPrompt();
// import employees from "./data.json" assert {type:'json'};
let employees=[];
let currencyData;

const loadData=async()=>
{
    try{

        const fileData=await fs.readFile('./data.json');
        employees=JSON.parse(fileData);
    }
catch(err)
{

    console.log("Cannot read File");
    throw err;
}


}

const writeData=async()=>
{
console.log("Write data to file");
try{

    await fs.writeFile('data.json',JSON.stringify(employees,null,1));

}
catch(err)
{

    console.log("Cannot write file");
    throw err;

}

}

const getCurrencyConversionData=async ()=>
{

    const headers=new Headers();
    headers.append("apikey",'Z2vHNQCewLae45ZH3ol84PvgRKxJkYe4');

    const options={

        method:'GET',
        redirect:'follow',
        
        headers:headers,
    }

    const response=await fetch("https://api.apilayer.com/exchangerates_data/latest?base=USD",options);
    if(!response.ok)
    {
        throw new Error("cannot fetch currency data");


    }
    currencyData=await response.json()

}


const getSalary=(amountUSD,currency)=>

{

const amount=(currency==="USD")?amountUSD:amountUSD*currencyData.rates[currency];

const formatter=Intl.NumberFormat('en-US',
{
    style:'currency',
    currency:currency
})

return formatter.format(amount);
}


const getInput=(promptText,validator,transformer)=>
{

    let value=prompt(promptText);
if(validator&&!validator(value))
{
return getInput(promptText,validator,transformer);
}
if(transformer)
{
    return transformer(value);
}
    return value;
}

//validator functions

const isIntegerValid=(min,max)=>
{

return(input)=>{
    let numValue=Number(input)
    if(!Number.isInteger(numValue) ||(numValue<min) ||(numValue>max))
    {
        return false;
    }
    return true
}
}
const isStringInputValid=(input)=>
{
return input ? true:false

}

const isBooleanInputValid=(input)=>
{
return (input==="yes" || input==="no")

}
//Log employee info

const logEmployee=(employee)=>
{

Object.entries(employee).forEach(entry=>{

    if(entry[0]!=="salaryUSD"||entry[1]!=="localCurrency")

    {
        console.log(`${entry[0]} :${entry[1]}`);
    }
    else{

        console.log(`Salary USD:${getSalary(employee.salaryUSD),"USD"}`)
        console.log(`Local Currency :${getSalary(employee.localCurrency,employee.localCurrency)} `)
    }
  
})
}

const searchById=()=>
{

    let id=getInput("Enter Id",null,Number)
    const result=employees.find(e=>e.id===id);
    if(result)
    {

        logEmployee(result);
        console.log("");

    }
    else{

        console.log("id not found");
    }
}

const searchByName=()=>
{
const firstNameSearch=getInput("FirstName").toLowerCase();
const lastNameSearch=getInput("lastName").toLowerCase();
const results=employees.filter(e=>
    {
if(firstNameSearch&&!e.firstName.toLowerCase().includes(firstNameSearch))
{
    return false;
}
if(lastNameSearch &&!e.lastName.toLowerCase().includes(lastNameSearch))
{
    return false;

}
return true
    });


    results.forEach((e,index)=>
    {
        console.log("");
console.log(`SearchResults:${index+1}`);

logEmployee(e);


    })

}
const getNextEmployeeId=()=>
{

    const maxID=Math.max(...employees.map(e=>e.id));
    return maxID+1

    
}


const addEmployee=async ()=>
{
console.log("Add employee")
    let employee={}
employee.id=getNextEmployeeId();
    employee.firstName=getInput("FirstName",isStringInputValid)
    employee.lastName=getInput("LastName",isStringInputValid)
    employee.isActive=getInput("Is Employee Active",isBooleanInputValid,(i=>i=="yes"));
let startDateYear=getInput("Employee Start year",isIntegerValid(1990,2024));
let startDateMonth=getInput("Employee start month",isIntegerValid(1,12));
let startDateDay=getInput("Employee start day",isIntegerValid(1,31));
employee.startDate=new Date(startDateYear,startDateMonth-1,startDateDay);
employee.salaryUSD=getInput("Employee salary in USD",isIntegerValid(10000,100000));
employee.localCurrency=getInput("Employee Local Currency(3 letter code)",isCurrencyCodeValid);


employees.push(employee);
await writeData();
}
const isCurrencyCodeValid=(code)=>
{
const currencyCodes=Object.keys(currencyData.rates);
return (currencyCodes.indexOf(code)>-1);

}
const listEmployees=()=>
{

    employees.forEach(e=>
        {
            logEmployee(e);
        prompt("Press enter to continue");

        }

);
console.log("List completed!");
}

const main =async()=>
{
    let command=process.argv[2].toLowerCase();;

    switch(command)
    {
    case 'list' : 
    console.log("List of Employees---------------");
    console.log("");
    listEmployees();
    break;
    case 'add' : 
    console.log("Add Employee---------------");
    console.log(" ");
    await addEmployee();
    break;
    
    case 'search-by-id' : 
    console.log("Employee ID");
    console.log("");
    searchById();
 
    break;
    
    case 'search-by-name' : 
    console.log("Employee Name");
    console.log(" ");
    searchByName();
    break;
    
    default : 
    console.log("Command not found..............");
    
    
    
    }

}


Promise.all([loadData(),getCurrencyConversionData()])
.then(main)
.catch((err)=>
{
    console.log("error");
    throw err;
})