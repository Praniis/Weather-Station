let choosen_location = {
    lat: "",
    lon: ""
};
var location_, ch_location;

$(document).ready(function () {

    feather.replace();

    $('#datetimes').daterangepicker({
        timePicker: true,
        startDate: moment().startOf('day'),
        endDate: moment(),
        locale: {
            format: 'DD/MM hh:mm A'
        }
    });


    $('#csvDownloadForm').validate({
        submitHandler: function (form) {
            let params = {
                resType: "csv",
                lat: $("#location_lat").val() || "",
                lon: $("#location_lon").val() || "",
                radius: 6000,
                sdate: new Date($('#csvDownloadForm #datetimes').data('daterangepicker').startDate).toISOString() || "",
                edate: new Date($('#csvDownloadForm #datetimes').data('daterangepicker').endDate).toISOString() || ""
            };
            let url = $(form).attr('action') + `?${new URLSearchParams(params).toString()}`;
            fileDownloader(url, 'Unable to download csv.');
            $('#csvModalCenter').modal('hide');
            return false;
        }
    });
    getUserLoc();
    setInterval(async function () {
        try {
            let params = {
                lat: choosen_location.lat || "",
                lon: choosen_location.lon || "",
                radius: 6000
            };
            let res = await fetch("/api/weather/lastData" + `?${new URLSearchParams(params).toString()}`);
            res = await res.json();
            if (res.dtime) {
                var dayName = moment(res.dtime).format('dddd').toUpperCase();
                var day = moment(res.dtime).format('YYYY-MM-DD');
                $(".date-dayname").text(dayName)
                $(".date-day").text(day)
                $(".location").text(`${params.lat}, ${params.lon}`)
                $(".humidity .value").text(`${res.humidity || '...'}`)
                $(".weather-temp").text(`${parseFloat(res.temperature).toFixed(1) || '...'}`)
            }
        } catch (error) {}
    }, 1000);
    
    async function getUserLoc() {
        let res = await fetch("https://ipapi.co/json/");
        res = await res.json();
        choosen_location.lat = res.latitude;
        choosen_location.lon = res.longitude;
    }
    
    function fileDownloader(url, errMessage = 'Unable to download') {
        let oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.setRequestHeader('X-AT-SessionToken', localStorage.sessionToken);
        oReq.responseType = "arraybuffer";
        oReq.onload = function (oEvent) {
            if (oReq.getResponseHeader('Content-Type') == 'text/csv') {
                let response = oReq.response;
                let blob = new Blob([response], { type: 'text/csv' });
                let fileName = oReq.getResponseHeader('Content-Disposition').split('filename=')[1] ||
                    `File ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
    
                if (typeof window.navigator.msSaveBlob !== 'undefined') {
                    window.navigator.msSaveBlob(blob, fileName);
                } else {
                    let blobURL = (window.URL && window.URL.createObjectURL) ? window.URL.createObjectURL(blob) : window.webkitURL.createObjectURL(blob);
                    let tempLink = document.createElement('a');
                    tempLink.style.display = 'none';
                    tempLink.href = blobURL;
                    tempLink.setAttribute('download', fileName);
                    if (typeof tempLink.download === 'undefined') {
                        tempLink.setAttribute('target', '_blank');
                    }
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    setTimeout(function () {
                        document.body.removeChild(tempLink);
                        window.URL.revokeObjectURL(blobURL);
                    }, 300);
                }
            } else if (oReq.getResponseHeader('Content-Type').match(/application\/json/gi)) {
                let response = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(oReq.response)));
                alert(response && response.error || errMessage);
            } else {
                alert(errMessage);
            }
        };
        oReq.send();
    }
});

function initMap() {
    location_ = new google.maps.places.Autocomplete((document.getElementById('locationName')), { types: ['geocode'] });
    location_.addListener('place_changed', function () {
        var place = location_.getPlace();
        $('#location_lat').val(place.geometry.location.lat());
        $('#location_lon').val(place.geometry.location.lng());
    });
    ch_location = new google.maps.places.Autocomplete((document.getElementById('ch_locationName')), { types: ['geocode'] });
    ch_location.addListener('place_changed', function () {
        var place = location.getPlace();
        $('#ch_location_lat').val(place.geometry.location.lat());
        $('#ch_location_lon').val(place.geometry.location.lng());
    });
}