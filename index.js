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

if(!appConfig.defaultPath || !appConfig.listsPath || !appConfig.listsType){
	initDefaultConfig();
}
initFolder();

// Initiate config JSON if it's empty
function initDefaultConfig(){
	appConfig.defaultPath = "./";
	appConfig.listsPath = "./lists/";
	appConfig.listsType = "json"
	fs.writeFileSync('./config.json', JSON.stringify(appConfig))
	signale.debug('Default Config Applied');
}

// Init lists folder
function initFolder(){
	try{
		check = fs.readdirSync(`${appConfig.listsPath}`);
	}catch(err){
		fs.mkdirSync(appConfig.listsPath);
	}
}

function askDetails(){
	const argv = require('minimist')(process.argv.slice(2));

	var questions = [
		{
		  type: 'list',
		  name: 'taskFileOperation',
		  message: 'What would you like to do with a task list file: ',
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
					message: 'Which file would you like to open: ',
					choices: getTskFileList(),
					filter: function(val) {
					return val.toLowerCase();
					}
				}
			];
		}else if(answers.taskFileOperation === 'create'){
			qst = [
				{
					type: 'list',
					name: 'ext',
					message: `Extension: `,
					choices: ['json', 'csv'],
				  },
			]
		}else if(answers.taskFileOperation === 'delete'){
			var qst = [
				{
					type: 'list',
					name: 'deleteFile',
					message: 'Which file would you like to delete?: ',
					choices: getTskFileList(),
					filter: function(val) {
						return val.toLowerCase();
					}
				}
			];
		}

		inquirer.prompt(qst).then(answ=> {
			if(answ.openFileName){
				printToDo(answ.openFileName);
			}else if(answ.ext){
				qst = [
					{
						type: 'input',
						name: 'fname',
						message: `File name: `,
					  },
				]
				inquirer.prompt(qst).then(answ1 => {
					addFile(`${answ1.fname}.${answ.ext}`);
				});
			}else if(answ.deleteFile){
				deleteFile(answ.deleteFile);
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
	var data = getTasksFromFile(fileName);

	// Header
	var Progress = clui.Progress;
	var thisProgressBar = new Progress(20);
	console.log(chalk.cyan.underline(fileName)); // Print File Name
	console.log(`\n${thisProgressBar.update(data.c / (data.p + data.c))}\n`);

	var options = [`Create a Task`, 'Delete a Task', 'Help', 'Close', new inquirer.Separator()];
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
		}else if(answ.useTask === 0){
			qst = [
				{
					type: 'input',
					name: 'msg',
					message: `Task's name: `,
				  },
			]
			inquirer.prompt(qst).then(answ => {
				addTask(answ.msg, fileName);
			});
		}
		else if(answ.useTask === 3){
			clear();
			printHeader();
			askDetails();
		}
		else if(answ.useTask === 1){
			deleteTask(fileName);
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
	var check = true;
	file.tasks.forEach(task =>{
		if(task.msg == newMsg){
			check = false;
		}
	})
	return check;
}

function addTask(newMsg, fileName){
	let file = require(`${appConfig.listsPath}${fileName}`);
	if(checkAvailability(newMsg, fileName)){
		file.tasks.push({"stat":"p","msg":`${newMsg}`})
		fs.writeFile(`${appConfig.listsPath}${fileName}`, JSON.stringify(file), function(err){
			if(err) signale.fatal(err);
		});
	}
	printToDo(fileName);
}

function deleteTask(fileName){
	clear();

	// Get The contents of the file
	let data = getTasksFromFile(fileName);
	let options = [];

	// Header
	console.log(chalk.cyan.underline(fileName)); // Print File Name
	console.log(chalk.red.bold('Delete Task: '));

	options.push(data.tasks);
	options.push([new inquirer.Separator(), chalk.red('Close')]);
	options = [].concat(...options); // To 1D array
	var qst = [
		{
			type: 'list',
			name: 'elId',
			message: 'Delete Task: ',
			choices: options,
			pageSize: 10,
			filter: function(val){
				return options.indexOf(val);
			}
		}
	];
	inquirer.prompt(qst).then(answ=>{
		console.log(answ);
		if (answ.elId < options.length-2){
			let file = require(`${appConfig.listsPath}${fileName}`);
			file.tasks.splice(answ.elId, 1);
			
			fs.writeFile(`${appConfig.listsPath}${fileName}`, JSON.stringify(file), function(err){
				if(err) signale.fatal(err);
				clear();
				printToDo(fileName);
			});
		}
	});
}

function toMenu(){
	clear();
	printHeader();
	askDetails();
}

function addFile(fileName){
	if(!fs.existsSync(appConfig.listsPath+fileName)){
		fs.writeFile(appConfig.listsPath+fileName, `{"tasks":[]}`, function(err){
			if(err) signale.fatal(err);
		});
		clear();
		printHeader();
		signale.success(`${fileName} was successfully created`);
		askDetails();
	}else{
		signale.fatal('This list already exists.')
		Spinner = clui.Spinner;
		var countdown = new Spinner('Exiting in 3 seconds...  ', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);
		countdown.start();
		var number = 3;
			setInterval(function () {
			number--;
			countdown.message('Exiting in ' + number + ' seconds...  ');
			if (number === 0) {
				countdown.stop();
				clear();
				toMenu();
			}
		}, 1000);
	}
}

function deleteFile(fileName){
	qst = [
		{
			type: 'list',
			name: 'res',
			message: `Do you want to delete ${fileName}?: `,
			choices: ['no', 'yes']
		  },
	]
	inquirer.prompt(qst).then(answ => {
		if(answ.res === 'yes'){
			fs.unlink(appConfig.listsPath + fileName, (err)=>{
				if(err) throw err;
				toMenu();
			});
		}else if(answ.res === 'no'){
			toMenu();
		}
	});
}

askDetails();