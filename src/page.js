const Database = require('./database/db');

const { subjects, weekdays, getSubject,  convertHours} = require('./utils/format');
const createProffy = require('./database/createProffy');


/* html  home */

const landingPage = (req, res) => {

    res.render("index.html");
}

/* html  study */

const study = async(req, res) => {
    const filters = req.query;

    //if there is nothing in the query, it will return to the study without the filters

    if(!filters.subject || !filters.weekday || !filters.time) {
        
        return res.render("study.html", {filters, subjects, weekdays});
        
    }

    //receives the conversion of hours into minutes

    const timeToMinutes = convertHours(filters.time); 

    // join query to receive the information registered in the study

    const query = `
        SELECT classes.*, proffys.*
        FROM proffys
        JOIN classes ON (classes.proffy_id = proffys.id)
        WHERE EXISTS(
            SELECT class_schedule.*
            FROM class_schedule
            WHERE class_schedule.class_id = classes.id
            AND class_schedule.weekday = ${filters.weekday}
            AND class_schedule.time_from <= ${timeToMinutes}
            AND class_schedule.time_to > ${timeToMinutes}
        )
            AND classes.subject = "${filters.subject}"
    
    `

    // cap error

    try {

        const db = await Database;

        const proffys = await db.all(query);

        proffys.map((proffy) => {
            proffy.subject = getSubject(proffy.subject);

        });

        return res.render("study.html", {proffys, filters, subjects, weekdays});

    } catch(err) {

        console.log("Erro ao conectar", err);
    }

    
}

/* html  give-classes */

const giveClasses = (req, res) => {
    return res.render("give-classes.html",{subjects, weekdays});
}

const saveClasses = async(req, res) => {
   

    const proffyValue = {
        name: req.body.name,
        avatar: req.body.avatar,
        whatsapp: req.body.whatsapp,
        bio: req.body.bio
    }

    const classValue = {
        subject: req.body.subject,
        cost: req.body.cost
    }

    const classScheduleValues = req.body.weekday.map(
        (weekday, index) => {

            return {
                weekday,
                time_from: convertHours(req.body.time_from[index]),
                time_to: convertHours(req.body.time_to[index])
            }
        })

        try {

            const db = await Database
            await createProffy(db, {proffyValue, classValue, classScheduleValues});

            let queryString ="?subject=" + req.body.subject;
            queryString += "&weekday=" + req.body.weekday[0];
            queryString += "&time=" + req.body.time_from[0];

           
            return res.redirect("/success" + queryString);  
                       

        } catch(err) {

            console.log("Erro: ", err);
        }

}

const success = (req, res) => {
    filters = req.query;
    res.render("success.html", {filters});
}

module.exports = {
                  landingPage, 
                  study, 
                  giveClasses, 
                  saveClasses,
                  success

                }