function ajax(options) {
    let method = options.method || 'get';
    let xhr = null;
    try{
        xhr = new XMLHttpRequest();
    }catch (e) {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }
    if(method === 'get'){
        xhr.open(method,options.url+'?'+options.data,true);
        xhr.send();
    }else if(method === 'post'){
        xhr.open(method,options.url,true);
        xhr.send(options.data);
    }else {
        console.log('请求方式有误');
    }
    xhr.onreadystatechange = function () {
        if(xhr.readyState === 4 && xhr.status === 200 ){
            options.success && options.success(xhr.responseText);
        }
    }
}