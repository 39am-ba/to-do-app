let data = [];

function createTask(nTask, entry_id) {
    const task = document.createElement('div');
    task.id = 'task';
    const taskDescription = document.createElement('div');
    taskDescription.id = 'task-description';
    const buttons = document.createElement('div');
    buttons.id = 'buttons';
    const text = document.createElement('p');
    text.id = 'text';
    text.innerText = nTask.task;
    const taskButton1 = document.createElement('button');
    const taskButton2 = document.createElement('button');
    taskButton1.classList.add('task-button');
    taskButton2.classList.add('task-button');
    taskButton1.innerText = '☑';
    taskButton1.addEventListener("click", function (e) {
        check(text, entry_id)
    });
    taskButton2.innerText = 'X';
    taskButton2.addEventListener("click", function (e) {
        clear(task, entry_id)
    });
    buttons.append(taskButton1, taskButton2);
    taskDescription.append(text);
    task.append(taskDescription, buttons);
    document.getElementById('tasks').append(task);
    if (nTask.task_status) {
        text.classList.add('done')
    }

}

fetch('main', {method: 'post'})
.then(res => {
    res.json().then(json => {
        data = json
        
        for (const task of data) {
            createTask(task, task.entry_id);
        }
    })
})


async function add() {
    const name = document.getElementById('name');
    if (!name.value) {
        alert('Enter task name please');
        return;
    }
    const task = {task: name.value, task_status: 0};
    name.value = '';
    options = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
    };
    const res = await fetch('/add', options);
    const json = await res.json();
    task.entry_id = json.data_added.insertId;
    createTask(task, task.entry_id);
    data.push(task);    
}

async function check(text, entry_id) {
    const obj = {entry_id: entry_id}    
    options = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
    };
    const res = await fetch('/check', options);
    const json = await res.json();
    console.log(json);
    text.classList.add('done');
}

async function clear(task, entry_id) {
    const obj = {entry_id: entry_id}
    options = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
    };
    const res = await fetch('/clear', options);
    const json = await res.json();
    console.log(json);
    task.remove();
}