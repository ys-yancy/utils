
function postUrl(url) {
	var form = document.createElement("FORM");
    form.method = "POST";
    form.target = '_blank';
    form.style.display = "none";
    document.body.appendChild(form);
    form.action = url.replace(/\?(.*)/, function(_, urlArgs) {
      urlArgs.replace(/\+/g, " ").replace(/([^&=]+)=([^&=]*)/g, function(input, key, value) {
        input = document.createElement("INPUT");
        input.type = "hidden";
        input.name = decodeURIComponent(key);
        input.value = decodeURIComponent(value);
        form.appendChild(input);
      });
      return "";
    });
    form.submit();	
}
