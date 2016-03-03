/**
    Model created for venue listed in map
*/
var Venue = function(list, foursquareID) {
    //Location information
    this.lat = list.venue.location.lat;
    this.lng = list.venue.location.lng;
    this.formattedAddresss = list.venue.location.formattedAddress;//Array contains address information
    //Venue brand information
    this.name = list.venue.name;
    this.id = list.venue.id;
    this.category = this.getCategory(list);
    //------Useful links--------------//
    this.photoPrefix = "https://irs2.4sqi.net/img/general/";
    this.photoSize = "100x100";
    //-----Possible info offered------//
    this.formattedContact = this.getFormattedContact(list);
    this.tips = this.getTipsInfo(list);
    this.url = this.getUrl(list);
    this.rating = this.getRating(list);
    this.photoUrl = this.getPhotoUrl(list);
}
Venue.prototype = {
    getFormattedContact: function(data) {
        if(!data.venue.contact.formattedPhone) {
            return "Contact not available";
        }
        return data.venue.contact.formattedPhone;
    },
    getTipsInfo: function(data) {
        if(!data.tips) {
            return "Tips not available";
        }
        return data.tips[0].text;
    },
    getUrl: function(data) {
        if(!data.venue.url) {
            return "Website not available";
        }
        return data.venue.url;
    },
    getRating: function(data) {
        if(!data.venue.rating) {
            return "Rating not available";
        }
        return data.venue.rating;
    },
    getPhotoUrl: function(data) {
        if(!data.featuredPhotos) {
            return "http://placehold.it/100x100";
        }
        return this.photoPrefix+this.photoSize+data.featuredPhotos.items[0].suffix;
    },
    getCategory: function(data) {
        if(!data.venue.categories[0]) {
            return "Category not available";
        }
        return data.venue.categories[0].name;
    }
}
function AppViewModel() {
    //-----Delivering object handler----//
    var self = this;
    var searchPos,
        infowindow,
        latInfo,
        lngInfo,
        bounds,
        map;
    var default_ExploreKeyWord = 'best nearby';
    //------Observable data--------------//
    self.search_location = ko.observable();
    self.exploreKeyword = ko.observable(default_ExploreKeyWord);//return the popular places in specified position
    self.popularLocation = ko.observableArray();//array contain all postion from foursquare

    //function getNearby
    //---------Inner function-------//
    function createMarkerWindowInfo() {
        var infoWindowContent = '<div class = '
    }
    //Create single marker for given venue object//
    function createVenueMarkers(venue) {
        //Position info for marker
        var venuePosition = new google.maps.LatLng(venue.lat, venue.lng);
        var venueMarker = new google.maps.Marker({
            map: map,
            position: venuePosition,
            title: venue.name
        });
        var markerWindowInfo = createMarkerWindowInfo(venue);
        //------Add clicker info-----//
        venueMarker.addListener('click', function() {
            map.setCenter(venuePosition);//move the center to the position marker if not in there
            //infowindow.open(map, positionMarker);
        });
    }
    //---------Create map center marker------//
    function setMapCenterMarker(position) {
        map.panTo(position.geometry.location);//move the map to searched result place
        //Create single market for the searched location point
        var positionIcon = {
            path: 'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z',
            fillColor: 'black',
            fillOpacity: 1,
            scale: 0.5
        };
        var positionMarker = new google.maps.Marker({
            map: map,
            position: position.geometry.location,
            title: position.name,
            icon: positionIcon
        });
        //Add event listener to the position Marker
        positionContent = "<h2>"+positionMarker.getTitle()+"<h2>";
            //Create inforwindow that contains position info
            infowindow = new google.maps.InfoWindow({
            content: positionContent
        });
        positionMarker.addListener('click', function() {
            //map.setZoom(8);
            map.setCenter(positionMarker.getPosition());//move the center to the position marker if not in there
            infowindow.open(map, positionMarker);
        });
    }
    //------------Request foursquare info---------------//
    function getFourSquareInfo() {
        var exploreURL = 'https://api.foursquare.com/v2/venues/explore?';
        var date_info = '&v='+getCurrentDate();
        var client_info = 'client_id=S1RJQM0E1RW01XHHNRHUD4ZCVO0JX2ELJHIJAPYNVGDU0TCO&client_secret=RS3IT5QWQJ34P20FSPDMMSFJ1NLUCY14LRZB31WAS2AKAUJZ';
        var query = '&query=' + self.exploreKeyword();
        var positionInfo = '&ll='+latInfo+','+lngInfo;
        var photoParameter = '&venuePhotos=1';
        var ajaxURL = exploreURL + client_info +date_info + photoParameter + positionInfo + query;
        //------Ajax request------//
        $.ajax({
            url : ajaxURL,
            success : function(data){
                console.log('request successful');
                console.log(data);
                var responseData = data.response.groups[0].items;//Array contain all venue information
                responseData.forEach(function(item){
                    //console.log(item.venue.name);
                    self.popularLocation.push(new Venue(item, client_info));
                });
                //-----Creating marker and photo------//
                self.popularLocation().forEach(function(venue){
                    console.log('Creating marker');
                    createVenueMarkers(venue);
                });
                //-----Change the map bounds for fitting----//
                var mapBounds = data.response.suggestedBounds;
                if (mapBounds != undefined) {
                    console.log('Bounds change');
                    bounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(mapBounds.sw.lat, mapBounds.sw.lng),
                        new google.maps.LatLng(mapBounds.ne.lat, mapBounds.ne.lng));
                    map.fitBounds(bounds);
                }
            },
            complete: function() {
                //if(self.topPicks().length === 0)
                    //$('#foursquare-API-error').html('<h2>No result available.</h2><h2>Please change your keywords.</h2>');
                console.log("result completed");
            },
            error: function( data ) {
                //$('#foursquare-API-error').html('<h2>There are errors when retrieving venue data. Please try refresh page later.</h2>');
                console.log('data request error');
            }
        });
    }
    function getGeographyInfoCallBack(placeList, status) {
        //The response do not contain a valid result
        if(status != google.maps.places.PlacesServiceStatus.OK) {
            $('#Map_Loading_Error').html('<h2>Errors in searching</h2><h2>Try other position name</h2>');
            return;
        }
        var searchPlace = placeList[0];
        console.log(searchPlace.geometry.location.toString());
        setMapCenterMarker(searchPlace);
        latInfo = searchPlace.geometry.location.lat();
        lngInfo = searchPlace.geometry.location.lng();
        //-------Request map info and draw marker----------//
        getFourSquareInfo();
        //-------------------------------------------------//

    }
    function getGeographyInfo(locationName) {
        var request = {
            query: locationName
        };
        searchService = new google.maps.places.PlacesService(map);
        searchService.textSearch(request, getGeographyInfoCallBack);
    }

    function getCurrentDate() {
        var date = new Date();
        var year = date.getFullYear()+'';
        var month = date.getMonth()+1;
        month = month > 9?month+'':'0'+month;
        var day = date.getDate();
        day = day > 9?day+'':'0'+day;
        return year+month+day;
    }
    //Function for initializing map
    function initializeMap() {
        mapOptions = {
            center: {lat: 37.777158, lng: -122.4185117},//just for test, initial position
            zoom: 15,
            diableDefaultUI: true
        };
        if(typeof google == 'undefined') {
            $('#Map_Loading_Error').html('<h2>Errors in retriving map</h2><h2>Check network and try refresh page later.</h2>');
            return;
        }
        map = new google.maps.Map(document.getElementById('Map_Canvas'), mapOptions);
        $('#Map_Canvas').height($(window).height());//Set the height of map to the height of whole window
        getGeographyInfo("Milpitas");
    };
    //Initialize map and set event listener to it so that the map is responsive
    google.maps.event.addDomListener(window, 'load', initializeMap);
    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });
    //-------Search function triggered by search button------//
    self.searchPos=function() {
        searchPos = self.search_location();
        console.log("Input position is "+searchPos);
        self.search_location("");
        //----------------------//
        getGeographyInfo(searchPos);
    }
}

//Initialize the AppViewModel
$(function() {
    ko.applyBindings(new AppViewModel());
});