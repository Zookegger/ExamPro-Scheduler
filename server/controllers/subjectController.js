const db = require('../models');

async function getAllSubject() {
    return await db.models.Subject.findAndCountAll();
}


export default {
    subjectController: {
        getAllSubject,
    }
}