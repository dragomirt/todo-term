const signale = require('signale');
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
	});
}

initReadme();

// Initiate config JSON if it's empty
function initDefaultConfig(){
	if(appConfig === undefined){
		appConfig.defaultPath = "./";
		appConfig.listsPath = "./lists/";
		appConfig.listsType = "json"
		fs.writeFileSync('./config.json', JSON.stringify(appConfig))
	}
}

// Init lists folder
function initReadme(){
	try{
		check = fs.readdirSync(`${appConfig.listsPath}readme.json`);
	}catch(err){
		signale.fatal(new Error(err));
		fs.writeFile(`${appConfig.listsPath}readme.json`, `{}` , function(err){
			if(err) signale.fatal(`\n${err}`);
		});
	}
}

clear();
console.log(figlet.textSync('To Do', {horizontalLayout: 'full'}));
signale.success("Made by: Dragomir Turcanu");

function askDetails(){
	const argv = require('minimist')(process.argv.slice(2));

	var questions = [
		{
		  type: 'list',
		  name: 'taskFileOperation',
		  message: 'What would you like to do with a task list file',
		  choices: ['open', 'create', 'delete'],
		  filter: function(val) {
			return val.toLowerCase();
		  }
		}
	  ];

	inquirer.prompt(questions).then(answers => {
		if(answers.taskFileOperation === 'open'){
			var qst = [
				{
					type: 'list',
					name: 'openFileName',
					message: 'Which file would you like to open',
					choices: getTskFileList(),
					filter: function(val) {
					return val.toLowerCase();
					}
				}
			];
		}else if(answers.taskFileOperation === 'create'){

		}else if(answers.taskFileOperation === 'delete'){

		}

		inquirer.prompt(qst).then(answ=> {
			if(answ.openFileName){
				let taskData = require(`${appConfig.listsPath}${answ.openFileName}`);
				let tasks = [];
				taskData.tasks.forEach(task => {
					let tsk;
					if(task.stat === 'p'){
						tsk = signale.pending(task.msg);
					}else if(task.stat === 'c'){
						tsk = signale.complete(task.msg)
					}
					tasks.push(tsk);
				})
				var qst = [
					{
						type: 'list',
						name: 'openFileName',
						message: 'Which file would you like to open',
						choices: tasks,
					}
				];
				inquirer.prompt(qst).then(answ => {console.log(answ)});
			}
		});
	});
}

function getTskFileList(){
	return fs.readdirSync(appConfig.listsPath)
}

askDetails();