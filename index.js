const config = {
no_ref: "off", //Control the HTTP referrer header, if you want to create an anonymous link that will hide the HTTP Referer header, please set to "on" .
cors: "on",//Allow Cross-origin resource sharing for API requests.
static_url: "https://go.quna.cf",
}

const html404 = `<!DOCTYPE html>
<body>
  <h1>404 Not Found.</h1>
  <p>这个地址不存在，请确认URL是否正确。</p>
</body>`

let response_header={
  "content-type": "text/html;charset=UTF-8",
} 

if (config.cors=="on"){
  response_header={
  "content-type": "text/html;charset=UTF-8",
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Methods": "POST",
  }
}

async function sha512(url){
    url = new TextEncoder().encode(url)

    const url_digest = await crypto.subtle.digest(
      {
        name: "SHA-512",
      },
      url, // The data you want to hash as an ArrayBuffer
    )
    const hashArray = Array.from(new Uint8Array(url_digest)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    //console.log(hashHex)
    return hashHex
}
async function checkURL(URL){
    let str=URL;
    let Expression=/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    let objExp=new RegExp(Expression);
    if(objExp.test(str)==true){
      if (str[0] == 'h')
        return true;
      else
        return false;
    }else{
        return false;
    }
} 
async function save_url(KEY,URL){
    return await LINKS.put(KEY, URL),KEY
}
async function is_url_exist(url_sha512){
  let is_exist = await LINKS.get(url_sha512)
  console.log(is_exist)
  if (is_exist == null) {
    return false
  }else{
    return is_exist
  }
}
async function is_key_exist(key){
  let is_exist = await LINKS.get(key)
  console.log(is_exist)
  if (is_exist == null) {
    return false
  }else{
    return is_exist
  }
}
async function handleRequest(request) {
  console.log(request)
  if (request.method === "POST") {
    let req=await request.json()
    console.log(req["url"])
    if(!await checkURL(req["url"])){
    return new Response(`{"status":500,"key":": Error: Url illegal."}`, {
      headers: response_header,
    })}
    let stat,random_key

    let xkey = await req["key"]
    let key_exist = await is_key_exist(xkey)
    if(key_exist){
        return new Response(`{"status":501,"key":": 【错误】ckey已经存在了，请换一个吧！"}`, {
        headers: response_header,
    })
    }else{
        stat,random_key=await save_url(req["key"], req["url"])
    }
    console.log(stat)
    if (typeof(stat) == "undefined"){
      return new Response(`{"status":200,"key":"/`+random_key+`"}`, {
      headers: response_header,
    })
    }else{
      return new Response(`{"status":200,"key":": Error:Reach the KV write limitation."}`, {
      headers: response_header,
    })}
  }else if(request.method === "OPTIONS"){  
      return new Response(``, {
      headers: response_header,
    })

  }

  const requestURL = new URL(request.url)
  const path = requestURL.pathname.split("/")[1]
  const params = requestURL.search;

  console.log(path)
  if(!path){

    const html= await fetch(config.static_url + "/index.html")
    
    return new Response(await html.text(), {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  })
  }

  const value = await LINKS.get(path);
  let location ;

  if(params) {
    location = value + params
  } else {
      location = value
  }
  console.log(value)
  

  if (location) {
    if (config.no_ref=="on"){
      let no_ref= await fetch(config.static_url + "/no-ref.html")
      no_ref=await no_ref.text()
      no_ref=no_ref.replace(/{Replace}/gm, location)
      return new Response(no_ref, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    })
    }else{
      return Response.redirect(location, 302)
    }
    
  }
  // If request not in kv, return 404
  return new Response(html404, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
    status: 404
  })
}


addEventListener("fetch", async event => {
  event.respondWith(handleRequest(event.request))
})
