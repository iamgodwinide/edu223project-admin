const router = require("express").Router();
const User = require("../models/User");
const Material = require("../models/Material");
const Department = require("../models/Department");
const Result = require("../models/Result");
const ResultList = require("../models/ResultList");
const bcrypt = require("bcryptjs");
const csv = require('csvtojson');
const path = require("path")
const getGrade = require("../utils/getGrade");
const calculate_gpa = require('../utils/gpaCalculator');
const { ensureAuthenticated } = require("../config/auth");
const fs = require("fs");

router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        const students = (await User.find({})).reverse();
        const materials = (await Material.find({})).reverse();
        const departments = (await Department.find({})).reverse();

        return res.render("index", { page_title: "EDUSOP | Welcome", students, materials, departments, req });
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
});


router.get("/students", ensureAuthenticated, async (req, res) => {
    try {
        const students = (await User.find({})).reverse();
        return res.render("students", { page_title: "EDUSOP | Students", students, req });

    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
});

router.get("/students/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const student = await User.findOne({ _id: id });
        const results = await Result.find({ matno: student.matno });

        const resultobj = {};
        const resultsArr = [];

        if (results.length === 0) {
            return res.render("student", { page_title: "EDUSOP | Student Profile", student, results: [], calculate_gpa, req });
        }

        results.forEach(r => {
            if (resultobj[r.session + r.semester]) {
                resultobj[r.session + r.semester].push(r);
            } else {
                resultobj[r.session + r.semester] = [r];
            }
        });

        Object.keys(resultobj).forEach((key, index, arr) => {
            resultsArr.push(resultobj[key])
            if ((index + 1) == arr.length) {
                return res.render("student", { page_title: "EDUSOP | Student Profile", student, results: resultsArr.reverse(), calculate_gpa, req });
            }
        });

    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
});

router.post("/students/:id", ensureAuthenticated, async (req, res) => {
    try {
        const {
            firstname,
            middlename,
            lastname,
            level,
            matno,
            phone,
            email,
            password
        } = req.body;

        const { id } = req.params;

        const student = await User.findOne({ matno });

        if (!firstname || !lastname || !level || !phone || !email) {
            req.flash("error_msg", "Please provide all required fields");
            return res.redirect(`/students/${id}`);
        }

        const update = {
            firstname,
            middlename,
            lastname,
            level,
            phone,
            email
        };

        if (password) {
            if (password.length < 6) {
                req.flash("error_msg", "password is too short");
                return res.redirect(`/students/${id}`);
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            update.password = hash;
        }
        await student.updateOne(update);
        req.flash("success_msg", "student profile updated successfully");
        return res.redirect(`/students/${id}`)
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
})

router.get("/delete-student/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await User.deleteOne({ _id: id });
        return res.redirect("/students");
    } catch (err) {
        console.log(err);
        return res.redirect("/");
    }
})

router.get("/add-students", ensureAuthenticated, (req, res) => {
    try {
        return res.render("addStudents", { page_title: "EDUSOP | Register Students", req });

    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
})

router.post("/add-one-student", ensureAuthenticated, async (req, res) => {
    try {
        const { firstname, middlename, lastname, department, matno, level, phone, email, password } = req.body;
        if (!firstname || !lastname || !matno || !department || !level || !phone || !email || !password) {
            return res.render("addStudents", { page_title: "EDUSOP | Register Students", req, ...req.body, error_msg: "Please fill all fields" });
        }

        if (matno.length !== 10) {
            return res.render("addStudents", { page_title: "EDUSOP | Register Students", req, ...req.body, error_msg: "Invalid Matno" });
        }

        if (phone.length !== 11) {
            return res.render("addStudents", { page_title: "EDUSOP | Register Students", req, ...req.body, error_msg: "Invalid phone number" });
        }

        const userExists = await User.findOne({ email });
        const userExists2 = await User.findOne({ matno: matno.toUpperCase() });

        if (userExists || userExists2) {
            return res.render("addStudents", { page_title: "EDUSOP | Register Students", req, ...req.body, error_msg: "Student with that email or matno already exists" });
        }

        const newStudent = {
            firstname,
            middlename: middlename || "",
            lastname,
            department,
            matno: matno.toUpperCase(),
            level,
            phone,
            email: email.toLowerCase()
        };

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        newStudent.password = hash;

        const studentDoc = new User(newStudent);
        await studentDoc.save();

        req.flash("success_msg", "Student registered successfully");
        return res.redirect("/add-students");
    } catch (err) {
        console.log(err);
        return res.render("addStudents", { page_title: "EDUSOP | Register Students", req, ...req.body, error_msg: "Internal server error" });
    }
});

router.post("/add-many-students", ensureAuthenticated, async (req, res) => {
    try {
        let success_counter = 0;
        let failed_counter = 0;
        let exists_counter = 0;

        const { department, level } = req.body;
        if (!department || !level || !req.files.csv) {
            return res.render("addStudents", {
                page_title: "EDUSOP | Register Students", req, ...req.body,
                error_msg: "Fill all required fields"
            });
        }

        if (!req.files.csv) {
            return res.render("addStudents", { page_title: "EDUSOP | Register Students", ...req.body, error_msg: "Please upload a valid csv file", req });
        }

        if (req.files.csv.mimetype !== "text/csv") {
            return res.render("addStudents", { page_title: "EDUSOP | Register Students", ...req.body, error_msg: "Please upload a valid csv file", req });
        }


        const csvFilePath = path.join(__dirname, "../", req.files.csv.tempFilePath);
        const jsonArray = await csv({
            trim: true
        }).fromFile(csvFilePath);

        const { firstname, lastname, middlename, phone, email, matno, password } = jsonArray[0];

        if (!firstname || !lastname || !phone || !email || !matno || !password) {
            return res.render("addStudents", {
                page_title: "EDUSOP | Register Students", req, ...req.body,
                error_msg: "Include all required columns in csv and make sure they are lowercase"
            });
        }

        jsonArray.forEach(async (student, index) => {
            const newStudent = { ...student, department: department.toUpperCase(), level, matno: student.matno.toUpperCase() };
            if (!newStudent.firstname || !newStudent.lastname || !newStudent.email || !newStudent.password || !newStudent.phone || !newStudent.matno) {
                failed_counter += 1;
            } else {

                const email_exists = await User.findOne({ email: newStudent.email });
                const matno_exists = await User.findOne({ matno: newStudent.matno });

                if (email_exists || matno_exists) {
                    exists_counter += 1;
                } else {
                    const salt = await bcrypt.genSalt();
                    const hash = await bcrypt.hash(student.password, salt);
                    newStudent.password = hash;
                    if (newStudent.phone.length == 10) newStudent.phone = "0" + newStudent.phone;
                    const studentDoc = new User(newStudent);
                    await studentDoc.save();
                    success_counter += 1;
                }
            }
            if ((index + 1) === jsonArray.length) {
                req.flash("success_msg", `Operation completed, Total registered: ${success_counter}, Already Exists: ${exists_counter}, Failed registered: ${failed_counter}.`);
                fs.unlink(csvFilePath, (err) => {
                    if (err) {
                        throw err;
                    }
                    return res.redirect("/add-students");
                });
            }
        });
    } catch (err) {
        console.log(err);
        return res.render("addStudents", { page_title: "EDUSOP | Register Students", req, ...req.body, error_msg: "Internal server error" });
    }
})

router.get("/materials", ensureAuthenticated, async (req, res) => {
    try {
        const materials = await Material.find({});
        return res.render("materials", { page_title: "EDUSOP | Materials", materials, req });
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
})

router.get("/add-material", ensureAuthenticated, (req, res) => {
    try {
        return res.render("addMaterial", { page_title: "EDUSOP | Upload Materials", req });
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
})

router.post("/add-material", ensureAuthenticated, async (req, res) => {
    try {
        const { name, level, department, semester, file } = req.body;
        if (!name || !level || !department || !semester || !file) {
            return res.render("addMaterial", { page_title: "EDUSOP | Upload Materials", ...req.body, error_msg: "Please enter all fields", req });
        }
        const newMat = {
            name,
            level,
            department,
            semester,
            file,
            author: req.user.fullname
        };

        const newDoc = new Material(newMat);
        await newDoc.save();
        req.flash("success_msg", "Material uploaded successfully");
        return res.redirect("/add-material");
    } catch (err) {
        console.log(err);
        return res.render("addMaterial", { page_title: "EDUSOP | Upload Materials", ...req.body, error_msg: "Internal server error", req });
    }
})

router.get("/delete-material/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await Material.deleteOne({ _id: id });
        req.flash("success_msg", "Material Deleted Successfully");
        return res.redirect("/materials")
    } catch (err) {
        return res.redirect("/materials")
    }
})

router.get("/departments", ensureAuthenticated, (req, res) => {
    try {
        return res.render("departments", { page_title: "EDUSOP | Departments", req });
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
})

router.get("/results", ensureAuthenticated, async (req, res) => {
    try {
        const results = (await ResultList.find({})).reverse();
        return res.render("results", { page_title: "EDUSOP | Results", results, req });
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
});

router.post("/results/:session1/:session2/:course/:level/:id/delete", ensureAuthenticated, async (req, res) => {
    try {
        const { session1, session2, course, level, id } = req.params;
        await ResultList.deleteOne({ _id: id });
        await Result.deleteMany({
            session: `${session1}/${session2}`,
            course: course.toUpperCase(),
            level,
        });
        req.flash("success_msg", "Results deleted successfully");
        return res.redirect("/results");
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
});

router.get("/results/:session1/:session2/:course/:level/:semester", ensureAuthenticated, async (req, res) => {
    try {
        const { session1, session2, course, level, semester } = req.params;

        const resultlist = await ResultList.findOne({
            session: `${session1}/${session2}`,
            course: course.toUpperCase(),
            level,
            semester: semester.toLowerCase()
        });

        const results = (await Result.find({
            session: `${session1}/${session2}`,
            course: course.toUpperCase(),
            level,
            semester: semester.toLowerCase()
        })).reverse();

        return res.render("viewResults", { page_title: "EDUSOP | Results", results, id: resultlist._id, req });
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
});

router.get("/add-results", ensureAuthenticated, (req, res) => {
    try {
        return res.render("addResults", { page_title: "EDUSOP | Upload Results", req });

    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
});

router.post("/add-results", ensureAuthenticated, async (req, res) => {
    try {

        let success_counter = 0;
        let failed_counter = 0;
        let updated_counter = 0;

        const {
            course,
            department,
            level,
            semester,
            session,
            credit
        } = req.body;

        const resultfile = req.files.csv;

        if (!course || !department || !level || !semester || !session || !credit) {
            return res.render("addResults", { page_title: "EDUSOP | Upload Results", ...req.body, error_msg: "Please provide all reuired fields", req });
        };

        if (!resultfile) {
            return res.render("addResults", { page_title: "EDUSOP | Upload Results", ...req.body, error_msg: "Please upload csv file", req });
        }

        if (resultfile.mimetype !== "text/csv") {
            return res.render("addResults", { page_title: "EDUSOP | Upload Results", ...req.body, error_msg: "Please upload a valid csv file", req });
        }

        const csvFilePath = path.join(__dirname, "../", req.files.csv.tempFilePath);
        const jsonArray = await csv({
            trim: true
        }).fromFile(csvFilePath);

        const resultshape = jsonArray[0];

        if (!resultshape) {
            return res.render("addResults", { page_title: "EDUSOP | Upload Results", ...req.body, error_msg: "CSV file must not be empty", req });
        }

        if (!resultshape.matno || !resultshape.score) {
            return res.render("addResults", { page_title: "EDUSOP | Upload Results", ...req.body, error_msg: "Must contain matno and socre heading", req });
        }

        const resultListExists = await ResultList.findOne({ course: course.toUpperCase(), session, level, semester });

        if (resultListExists) {
            await resultListExists.updateOne({
                credit,
                department,
            })
        } else {
            const newResultList = {
                course: course.toUpperCase(),
                department,
                level,
                semester,
                session,
                credit,
                author: req.user.fullname
            };

            const newResultListDoc = new ResultList(newResultList);
            await newResultListDoc.save();
        }

        jsonArray.forEach(async (result, index) => {
            const { matno, score } = result;
            if (!matno || !score) {
                failed_counter += 1;
            } else {
                const resultExists = await Result.findOne({ course: course.toUpperCase(), session, matno: matno.toUpperCase(), level, semester });
                if (resultExists) {
                    await resultExists.updateOne({
                        score,
                        course: course.toUpperCase(),
                        department,
                        level,
                        semester,
                        session,
                        credit,
                        grade: getGrade(score)
                    })
                    updated_counter += 1;
                } else {
                    const newResult = {
                        score,
                        matno,
                        course: course.toUpperCase(),
                        department,
                        level,
                        semester,
                        session,
                        credit,
                        grade: getGrade(score)
                    };

                    const newResultDoc = new Result(newResult);
                    await newResultDoc.save();
                    success_counter += 1;
                }
            }
            if ((index + 1) === jsonArray.length) {
                fs.unlink(csvFilePath, (err) => {
                    if (err) {
                        throw err;
                    }
                    req.flash("success_msg", `Operation completed, Total added: ${success_counter}, Toal updated: ${updated_counter}, Failed uploads: ${failed_counter}.`);
                    return res.redirect("/add-results");
                });

            }
        });
    } catch (err) {
        console.log(err);
        return res.redirect("/")
    }
});


module.exports = router;