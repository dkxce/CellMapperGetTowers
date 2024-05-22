function listener(details) 
{ 
  const del = ';';
  const url = new URL(details.url);  
  if (!url.pathname == 'api.cellmapper.net') return null;
  if (!url.pathname.startsWith("/v6/getTowers")) return null;
  console.log(details.url);
  
  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder("utf-8");
  let encoder = new TextEncoder();  
  let allData = "";

  filter.ondata = event =>
  {	
    let str = decoder.decode(event.data, {stream: true});      
	allData += str;
	filter.write(encoder.encode(str));
  };
  
  filter.onstop  = (event) =>
  {
		filter.close();
		try
		{
			var documentJson = JSON.parse(allData);
			if (typeof documentJson.responseData != 'undefined' && documentJson.responseData.length > 0)
			{
				var txt = 'NUM' + del; // CSV
				var empty = '';
				for (const [key, value] of Object.entries(documentJson.responseData[0])) { txt += key + del; empty += del; };
				txt += del + 'CRLF\r\n'; empty += del + '<br/>\r\n';
				for(var i = 0; i < documentJson.responseData.length; i++)
				{
					txt += i + del;
					for (const [key, value] of Object.entries(documentJson.responseData[0])) 
					if(typeof documentJson.responseData[i][key] != 'undefined')
						txt += (typeof value == 'object' ? JSON.stringify(documentJson.responseData[i][key]) : documentJson.responseData[i][key]) + del;
					txt += del + '<br/>\r\n';
				};
				txt += 'URL: ' + details.url + del + empty;
				txt += 'Copyrights (c) https://github.com/dkxce' + del + empty;
				// console.log(txt); // document.write(txt);
				let blob = URL.createObjectURL(new Blob([txt], { type: "text/csv" }));

				let sp = url.searchParams;
				let fileName = sp.get('MCC') + '_' + sp.get('MNC') + '_' + sp.get('RAT') + '_(' + sp.get('boundsNELatitude').substring(0,9) + ',' + sp.get('boundsNELongitude').substring(0,9) + ';' + sp.get('boundsSWLatitude').substring(0,10) + ',' + sp.get('boundsSWLongitude').substring(0,10)+')';
				
				var a = document.createElement("a"); document.body.appendChild(a);
				a.style = "display:none;"; a.href = blob; a.download = fileName + ".csv"; a.click();
				window.URL.revokeObjectURL(url);
				
				//var creating = browser.tabs.create({url: blob, active: false});	
				//creating.then((tab) => setTimeout(() => browser.tabs.remove(tab.id), 1000), null);
			};		
		}
		catch (e) { console.log(e); };
  };
  
  return null;
}

browser.webRequest.onBeforeRequest.addListener( listener, {urls: ["https://*/*","http://*/*"]}, ["blocking","requestBody"] );
