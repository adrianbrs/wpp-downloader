/** 
 * WhatsApp Contact Downloader
 * v0.0.1
 * By Adrian Cerbaro
 */
(() => {

    let contatos = []
    let elements = document.getElementsByClassName("rK2ei")[0].getElementsByClassName("_1v8mQ")

    for(let i = 0; i < elements.length; i++) {
        let cur = elements[i]
        let foto = cur.getElementsByTagName("img").length > 0 ? cur.getElementsByTagName("img")[0].src : ""
        let nome = cur.getElementsByClassName("_3H4MS")[0].getElementsByTagName("span")[0].title
        
        let contato = cur.getElementsByClassName("_1VwzF")[0].getElementsByClassName("_22OEK")[0].getElementsByClassName("_F7Vk")[0].innerText
        
        let email = "", numero = ""
        if(validateEmail(contato)) email = contato
        else numero = contato

        contatos.push({nome, numero, email, foto})
    }

    let fileContent = ""
    for(let i = 0; i < contatos.length; i++) {
        let cont = contatos[i]
        fileContent += `${cont.nome},${cont.numero},${cont.email}\r\n`
    }
    download("contatos.csv", fileContent)

    function download(filename, data) {
        let blob = new Blob([data], {type: 'text/csv'});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else{
            let elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;        
            document.body.appendChild(elem);
            elem.click();        
            document.body.removeChild(elem);
        }
    }

    function validateEmail(email) {
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

})()