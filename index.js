const http = require('http');
const url = require('url');
const fs = require('fs');
const queryString = require('querystring');
const mysql = require('mysql');
const cookie = require('cookie');

http.createServer(function (req,res) {

    let connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'root',
        database : 'userlist'
    });
    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }
        console.log('connected as id ' + connection.threadId);
    });

    let url_obj = url.parse(req.url);
    //加载首页
    if(url_obj.pathname === '/'){
        render('./template/login.html',res);
        return;
    }
    //登录
    if(url_obj.pathname === '/login_on' && req.method === 'POST'){
        let post_str = '';
        req.on('data',function (chunk) {
            post_str += chunk;
        });
        req.on('end',function () {
            let post_obj = queryString.parse(post_str);
            let my_str = `SELECT username FROM admin WHERE username='${post_obj.username}' AND password='${post_obj.password}'`;
            // SELECT password FROM admin WHERE username='张一'
            connection.query(my_str,function (err,results) {
                if(!err && results && results.length !== 0){
                    res.setHeader('Set-Cookie',cookie.serialize('isLogin','true'));
                    res.write('{"status":0,"message":"登录成功"}','utf-8');
                    res.end();
                }else {
                    res.write('{"status":1,"message":"用户名或密码错误"}','utf-8');
                    res.end();
                }
            })
        });
        return;
    }
    //注册新管理员
    if(url_obj.pathname === '/newManage' && req.method === 'POST'){
        let post_str = '';
        req.on('data',function (chunk) {
            post_str += chunk;
        });
        req.on('end', function () {
            let post_obj = queryString.parse(post_str);
            let my_str = `SELECT username FROM admin WHERE username='${post_obj.username}'`;
            connection.query(my_str, function (error, results) {
                if (!error && results.length === 0){
                    my_str = `INSERT INTO admin(username,password) VALUES('${post_obj.username}','${post_obj.password}')`;
                    connection.query(my_str,function (err,results) {
                        console.log(results);
                        if(!err && results && results !== 0){
                            res.write('{"status":0,"message":"注册成功"}');
                            res.end();
                        }
                    })
                }else {
                    res.write('{"status":1,"message":"用户名已被注册"}');
                    res.end();
                }
            });
        });
        return;
    }
    //渲染用户列表
    if(url_obj.pathname === '/showList' && req.method === 'GET'){
        let my_str = 'SELECT * FROM userInfo';
        connection.query(my_str,function (err,results) {
            if(!err && results && results.length !== 0){
                let toJson = JSON.stringify(results);
                res.write(toJson);
                res.end();
            }else {
                res.write('{"status":1,"message":"查询失败"}');
                res.end();
            }
        })
    }
    //加载用户管理页面
    if(url_obj.pathname === '/admin.html'){
        if(cookie.parse(req.headers.cookie || '').isLogin === "true"){
            render('./template/admin.html',res);
        }else {
            res.write('hello');
            res.end();
        }
        return;
    }
    //添加新的用户
    if(url_obj.pathname === '/addUser' && req.method === 'POST'){
        let post_str = '';
        req.on('data',function (chunk) {
            post_str += chunk;
        })
        req.on('end',function () {
            let post_obj = queryString.parse(post_str);
            let my_str = `SELECT name FROM userInfo WHERE email='${post_obj.email}' AND phone='${post_obj.phone}'`;
            connection.query(my_str,function (err,results) {
                if(!err && results && results.length === 0){
                    my_str = `INSERT INTO userInfo VALUES(null,'${post_obj.name}','${post_obj.email}','${post_obj.phone}','${post_obj.qq}')`;
                    connection.query(my_str,function (err,results) {
                        if(!err && results && results.length !== 0){
                            connection.query(`SELECT id FROM userInfo WHERE email='${post_obj.email}' AND phone=${post_obj.phone}`,function (err,results) {
                                if(!err && results && results.length !== 0){
                                    let toJson = JSON.stringify(results);
                                    res.write(toJson);
                                    res.end();
                                }
                            });
                        }else {
                            res.write('{"status":2,"message":"添加用户失败"}');
                            res.end();
                        }
                    })
                }else {
                    res.write('{"status":1,"message":"用户已存在"}');
                    res.end();
                }
            })
        })
        return;
    }
    //删除信息
    if(url_obj.pathname === '/deleteUser' && req.method === 'POST'){
        let post_str = '';
        req.on('data',function (chunk) {
            post_str += chunk;
        })
        req.on('end',function () {
            let post_obj = queryString.parse(post_str);
            let my_str = 'DELETE FROM userInfo WHERE id='+Number(post_obj.id);
            // console.log(my_str)
            connection.query(my_str,function (err,results) {
                if(!err && results && results.length !== 0 ){
                    res.write('{"status":0,"message":"删除成功"}');
                    res.end();
                }else {
                    res.write('{"status":1,"message":"删除失败"}');
                    res.end();
                }
            })
        })
        return;
    }
    //编辑用户信息
    if(url_obj.pathname === '/editUser' && req.method === 'POST'){
        let post_str = '';
        req.on('data',function (chunk) {
            post_str += chunk;
        })
        req.on('end',function () {
            let post_obj = queryString.parse(post_str);
            let my_str = `SELECT id FROM userInfo WHERE email='${post_obj.email}'`;
            connection.query(my_str,function (err,results) {
                if(!err && results){
                    let toJson = JSON.stringify(results);
                    let res_arr = JSON.parse(toJson);//解析出的res_str是个对象数组
                    if((res_arr.length && res_arr[0].id === Number(post_obj.id)) || res_arr.length === 0){
                        //继续判断id ？== 原id
                        my_str = `UPDATE userInfo SET name='${post_obj.name}',
                        email='${post_obj.email}',phone='${post_obj.phone}',
                        qq='${post_obj.qq}' WHERE id=${Number(post_obj.id)}`;
                        connection.query(my_str,function (err,results) {
                            if(!err && results){
                                res.write('{"status":0,"message":"数据更新成功"}');
                                res.end();
                            }
                        })
                    }else{
                        //邮箱已被使用，不可以修改，信息
                        res.write('{"status":1,"message":"邮箱已被使用"}');
                        res.end();
                    }
                }
            })
        });
        return;
    }
    //调用render函数加载项目配套文件
    render('./template'+url_obj.pathname,res);
    connection.end();
}).listen(3000,function (err) {
    if(!err){
        console.log('listening 3000 ...')
    }
});
function render(path,res) {
    fs.readFile(path,'binary',function (err,data) {
        if(!err){
            res.write(data,'binary');
            res.end();
        }
    })
}