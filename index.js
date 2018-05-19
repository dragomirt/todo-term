const {	Signale	} = require('signale');
const chalk = require('chalk');
const figlet = require('figlet');
const clear = require('clear');
const inquirer = require('inquirer');
const fs = require('fs');
const clui = require('clui');
let appConfig;

// Custom Signale
const signaleCustomOptions = {
	scope: 'custom',
	types: {
		bye: {
		badge: '👋',
		color: 'yellow',
		label: '	bye'
		}
	}
};
const customSignale = new Signale(signaleCustomOptions);
const signale = new Signale(); // Default values

clear();
function printHeader(){
	console.log(figlet.textSync('To Do', {horizontalLayout: 'full'}));
	signale.success("Made by: Dragomir Turcanu");
}

printHeader();
	
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
		signale.debug('Default Config Applied');
	}
}

// Init lists folder
function initReadme(){
	try{
		check = fs.readdirSync(`${appConfig.listsPath}`);
	}catch(err){
		signale.fatal(new Error(err));
		fs.writeFile(`${appConfig.listsPath}readme.json`, `{}` , function(err){
			if(err) signale.fatal(`\n${err}`);
			signale.debug('Created tasks directory')
		});
	}
}

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
				printToDo(answ.openFileName);
			}
		});
	});
}

function getTskFileList(){
	return fs.readdirSync(appConfig.listsPath)
}

function getTasksFromFile(fileName){
	let taskData = require(`${appConfig.listsPath}${fileName}`);
	let tasks = [];
	let p, c; p = c = 0;
	taskData.tasks.forEach(task => {
		let tsk;
		if(task.stat === 'p'){
			tsk = chalk.yellow(`[ ] ${task.msg}`); p++;
		}else if(task.stat === 'c'){
			tsk = chalk.cyan(`[x] ${task.msg}`); c++
		}
		tasks.push(tsk);
	})
	return {tasks, p, c};
}

function printToDo(fileName){
	clear();

	// Get The contents of the file
	let data = getTasksFromFile(fileName);

	// Header
	var Progress = clui.Progress;
	let thisProgressBar = new Progress(20);
	console.log(chalk.cyan.underline(fileName)); // Print File Name
	console.log(`\n${thisProgressBar.update(data.p / (data.p + data.c))}\n`);

	let options = [`Create a Task`, 'Delete a Task', 'Help', 'Close', new inquirer.Separator()];
	options.push(data.tasks);
	options.push([new inquirer.Separator(), chalk.red('Exit')]);
	options = [].concat(...options); // To 1D array
	var qst = [
		{
			type: 'list',
			name: 'useTask',
			message: 'Tasks',
			choices: options,
			pageSize: 15,
			filter: function(val){
				return options.indexOf(val);
			}
		}
	];
	inquirer.prompt(qst).then(answ=>{
		if(answ.useTask === options.length-1){
			clear();
			customSignale.bye();
			process.exit();
		}else if(answ.useTask > 3){
			switchStat(answ.useTask-5, fileName);
		}
	});
}

function switchStat(task_id, fileName){
	let file = require(`${appConfig.listsPath}${fileName}`);
	let prevStat = file.tasks[task_id].stat;
	let newStat;
	if(prevStat === 'c'){newStat = 'p'}
	else if(prevStat === 'p'){ newStat = 'c'}
	file.tasks[task_id].stat = newStat;
	fs.writeFile(`${appConfig.listsPath}${fileName}`, JSON.stringify(file), function(err){
		if(err) signale.fatal(err);
	});
	printToDo(fileName);
}

function checkAvailability(newMsg, fileName){
	let file = require(`${appConfig.listsPath}${fileName}`);
	file.tasks.forEach(task =>{
		if(task.msg === newMsg){
			return false;
		}
	})

	return true;
}

askDetails();