require('dotenv').config();
const axios = require('axios');

const requiredEnvVars = ['KAITEN_API_TOKEN', 'KAITEN_MEMBER_ID'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Отсутствует обязательная переменная окружения: ${envVar}`);
    }
}

const columns = {
    queue: [2417327, 'В очереди'],
    on_feedback: [3874501, 'На оценке'],
    work: [2417328, 'В работе'],
    review: [3993153, 'На ревью'],
    talks: [2418428, 'На согласовании'],
};

async function fetchData() {
    try {
        const response = await axios({
            url: `${process.env.KAITEN_API_URL || 'https://btlz.kaiten.ru/api/latest'}/cards`,
            method: 'get',
            headers: {
                Authorization: `Bearer ${process.env.KAITEN_API_TOKEN}`
            },
            params: {
                member_ids: process.env.KAITEN_MEMBER_ID,
            }
        });
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        throw error;
    }
}

async function generateReport() {
    const data = {
        queue: [],
        on_feedback: [],
        work: [],
        review: [],
        talks: [],
    };

    try {
        const tasks = await fetchData();

        for (let task of tasks) {
            const taskData = [task.title, `https://btlz.kaiten.ru/${task.id}`];

            if (task.column.id == columns.queue[0]) {
                data.queue.push(taskData);
            } else if (task.column.id == columns.on_feedback[0]) {
                data.on_feedback.push(taskData);
            } else if (task.column.id == columns.work[0]) {
                data.work.push(taskData);
            } else if (task.column.id == columns.review[0]) {
                data.review.push(taskData);
            } else if (task.column.id == columns.talks[0]) {
                data.talks.push(taskData);
            }
        }

        let ch = 1;
        let message = '``` Отчёт за сегодня:\n';

        for (let key in data) {
            let status = columns[key][1];
            let dataSet = data[key];
            
            if (dataSet.length > 0) {
                for (let task of dataSet) {
                    message += `\n${ch}. [${task[0]}](${task[1]}) -- ${status}`;
                    ch += 1;
                }
            }
        }


        message += '\n\n---\n';
        for (let key in data) {
            if (data[key].length > 0) {
                message += `\n${columns[key][1]}: ${data[key].length}`;
            }
        }
        message += '```'


        console.log(message);
        return message;
    } catch (error) {
        console.error('Ошибка при генерации отчёта:', error);
        return 'Не удалось сформировать отчёт';
    }
}

generateReport();