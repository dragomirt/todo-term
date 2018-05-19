const chalk = require('chalk');
const figlet = require('figlet');
const clear = require('clear');
const inquirer = require('inquirer');
const fs = require('fs');
let appConfig;

try{
	appConfig = require('./config.json');
}catch(err){
	fs.writeFile('config.json', `{}`, function(error){
		if(error) throw error;
		appConfig = require('./config.json');
		initDefaultConfig();
		console.log('Hi!')
	});
}

// Initiate config JSON if it's empty
function initDefaultConfig(){
	if(appConfig === undefined){
		appConfig.defaultPath = "./";
		appConfig.listsPath = "./lists";
		appConfig.listsType = "json"
		fs.writeFileSync('./config.json', JSON.stringify(appConfig))
	}
}

clear();
console.log(
	chalk.green(
		figlet.textSync('To Do', {horizontalLayout: 'full'})
	)
);

function askDetails(){
	const argv = require('minimist')(process.argv.slice(2));

	var questions = [
		{
		  type: 'list',
		  name: 'size',
		  message: 'What size do you need?',
		  choices: ['kek', 'lul', '123'],
		  filter: function(val) {
			return val.toLowerCase();
		  }
		}
	  ];

	inquirer.prompt(questions).then(answers => {console.log(answers)})
    //return inquirer.prompt(questions);
}

askDetails();