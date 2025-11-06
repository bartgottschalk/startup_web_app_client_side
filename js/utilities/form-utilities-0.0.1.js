$.isEmail = function (email) {
	var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	return regex.test(email);
}

$.isAlpha = function (string_val) {
	var regex = /^[a-zA-Z]*$/;
	return regex.test(string_val);
}

$.isNumeric = function (string_val) {
	var regex = /^[0-9]*$/;
	return regex.test(string_val);
}

$.isAlphaNumeric = function (string_val) {
	var regex = /^[a-zA-Z0-9]*$/;
	return regex.test(string_val);
}

$.isCapitalAlphaNumeric = function (string_val) {
	var regex = /^[A-Z0-9]*$/;
	return regex.test(string_val);
}

$.isAlphaNumericSpace = function (string_val) {
	var regex = /^[a-zA-Z0-9 ]*$/;
	return regex.test(string_val);
}

$.isAlphaNumericUnderscoreHyphen = function (string_val) {
	var regex = /^[a-zA-Z0-9_-]*$/;
	return regex.test(string_val);
}

$.containsCapitalLetter = function (string_val) {
	var regex = /.*[A-Z].*/;
	return regex.test(string_val);
}

$.containsSpecialCharacter = function (string_val) {
	var regex = /.*[!@#$%^&*()~{}\[\]].*/;
	return regex.test(string_val);
}

$.isFloatOrFraction = function (string_val) {
	var regex = /^[0-9./ ]*$/;
	return regex.test(string_val);
}

$.isQuantityValid = function (quantity, max_length) {
	//console.log('$.isQuantityValid called');
	var errors = [];
	if (!$.isNumeric(quantity)) {
		//console.log('name is NOT valid');		
		errors.push(not_numeric);
	}
	if (quantity.length > max_length) {
		errors.push(too_many_chars);
	}
	//console.log(errors);
	return errors;
}

$.isDiscountCodeValid = function (code) {
	//console.log('$.isDiscountCodeValid called');
	var errors = [];
	if (code == '') {
		errors.push(required_error);
	}
	if (!$.isCapitalAlphaNumeric(code)) {
		//console.log('name is NOT valid');		
		errors.push(not_valid_code);
	}
	//console.log(errors);
	return errors;
}

$.isNameValid = function (name, max_length) {
	//console.log('$.isNameValid called');
	var errors = [];
	if (name == '') {
		errors.push(required_error);
	}
	if (!$.isAlphaNumericSpace(name)) {
		//console.log('name is NOT valid');		
		errors.push(not_valid_name);
	}
	if (name.length > max_length) {
		errors.push(too_many_chars);
	}
	//console.log(errors);
	return errors;
}

$.isEmailValid = function (email, max_length) {
	var errors = [];
	if (email == '') {
		//console.log('email is empty');		
		errors.push(required_error);
		return errors;
	}
	if (!$.isEmail(email)) {
		//console.log('email is NOT valid');		
		errors.push(not_valid_email);
	}
	if (email.length > max_length) {
		errors.push(too_many_chars);
	}
	return errors;
}

$.isUserNameValid = function (username, max_length) {
	var errors = [];
	if (username == '') {
		errors.push(required_error);
	}
	if (!$.isAlphaNumericUnderscoreHyphen(username)) {
		//console.log('email is NOT valid');		
		errors.push(not_valid_username);
	}
	if (username.length > max_length) {
		errors.push(too_many_chars);
	}
	if (username.length >= 1 && username.length < 6) {
		errors.push(username_too_short);
	}
	//errors.push(username_unavailable);
	return errors;
}

$.isPasswordValid = function (password, max_length) {
	var errors = [];
	if (password == '') {
		errors.push(required_error);
	}
	if (password.length > max_length) {
		errors.push(too_many_chars);
	}
	if (password.length >= 1 && password.length < 8) {
		errors.push(password_too_short);
	}
	if (!$.containsCapitalLetter(password)) {
		errors.push(password_must_contain_capital_letter);
	}
	if (!$.containsSpecialCharacter(password)) {
		errors.push(password_must_contain_special_character);
	}
	return errors;
}

$.isLoginUserNameValid = function (username, max_length) {
	var errors = [];
	if (username == '') {
		errors.push(required_error);
	}
	//errors.push(username_unavailable);
	return errors;
}

$.isLoginPasswordValid = function (password, max_length) {
	var errors = [];
	if (password == '') {
		errors.push(required_error);
	}
	return errors;
}

$.isConfirmPasswordValid = function (confirm_password, password) {
	var errors = [];
	if (confirm_password != password) {
		errors.push(confirm_password_doesnt_match);
	}
	return errors;
}

$.isTermsOfUseAgreeValid = function (termsOfUseAgree) {
	var errors = [];
	if (termsOfUseAgree != 'true') {
		errors.push(terms_of_use_agree_required);
	}
	return errors;
}

$.isImageFileEValid = function (file, max_size) {
	//console.log('$.isImageFileExtensionValid called');
	var errors = [];
	if (file['name'] == '') {
		errors.push(file_name_required_error);
	}
	var re = /(?:\.([^.]+))?$/;
	var extension = re.exec(file['name'])[1];
	//console.log(extension);
	if (extension.toLowerCase() == 'png' || extension.toLowerCase() == 'jpg' || extension.toLowerCase() == 'jpeg' || extension.toLowerCase() == 'gif') {
		//console.log('extension IS valid');		
	}
	else {
		//console.log('extension is NOT valid');		
		errors.push(image_file_extension_not_valid);
	}
	if (file['size'] > max_size) {
		errors.push(image_file_too_large);
	}
	//console.log(errors);
	return errors;
}

$.isChatMessageValid = function (message, max_length) {
	//console.log('$.isNameValid called');
	var errors = [];
	if (message == '') {
		errors.push(required_error);
	}
	if (message.length > max_length) {
		errors.push(too_many_chars);
	}
	//console.log(errors);
	return errors;
}



var required_error = {'type': 'required','description': 'This is a required field.'};
var not_valid_email = {'type': 'not_valid','description': 'Please enter a valid email address. For example johndoe@domain.com.'};
var not_valid_name = {'type': 'not_valid','description': 'Please enter a valid name. Characters, numbers and spaces are allowed.'};
var too_many_chars = {'type': 'too_many_chars','description': 'The value you entered is too long for this field.'};
var not_valid_username = {'type': 'not_valid','description': 'Please enter a valid username. Characters, numbers, underscore ("_"), and hyphens ("-") are allowed.'};
var username_too_short = {'type': 'too_short','description': 'The username you entered is too short. Usernames must be between 6 and 150 characters in length.'};
var username_unavailable = {'type': 'unavailable','description': 'The username you entered is unavailable. Please enter a different username and try again.'};
var password_too_short = {'type': 'too_short','description': 'The password you entered is too short. Passwords must be between 8 and 150 characters in length.'};
var password_must_contain_capital_letter = {'type': 'no_capital_letter','description': 'Passwords must contain at least one capital letter.'};
var password_must_contain_special_character = {'type': 'no_special_character','description': 'Passwords must contain at least one special character.'};
var confirm_password_doesnt_match = {'type': 'confirm_password_doesnt_match','description': 'Please make sure your passwords match.'};
var terms_of_use_agree_required = {'type': 'terms_of_use_agree_required','description': 'You must review and agree to the Terms of Use and Privacy Policy.'};
var file_name_required_error = {'type': 'file_name_required_error','description': 'File name cannot be empty'};
var image_file_extension_not_valid = {'type': 'image_file_extension_not_valid','description': 'The image file must have ".png", ".jpg", ".jpeg", or ".gif" extension.'};
var image_file_too_large = {'type': 'image_file_too_large','description': 'The file you selected is too large. Maximum size is 20 MB.'};
var not_numeric = {'type': 'not_numeric','description': '0-99'};
var not_valid_code = {'type': 'not_valid_code','description': 'The discount code you entered is not valid.'};



$.getCookie = function (name) {
	var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
	    var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
	        // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

$.setCookie = function (name, value, days) {
    var expires;

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

$.set_place_holder_listeners = function(field, placeholder_text) {
	//console.log(placeholder_text);
	field.focusin(function (event)
	{
	    field.attr('placeholder', '');
	});
	field.focusout(function (event)
	{
	    if (field.val() == '') {
	    	field.attr('placeholder', placeholder_text);
		}
	})	
}

$.bind_key_to_form_submit_button = function(form_field, keyboard_key, button, keyCode) {
	form_field.bind(keyboard_key,function(e){
	   //console.log("enter pressed");
	   button.trigger("click");
	});
	form_field.keyup(function(e){
	    if(e.keyCode == keyCode)
	    {
			//console.log("13 pressed");
	        $(this).trigger(keyboard_key);
	    }
	});
}

$.display_errors = function(error_arr, error_message_div, error_field, id_prefix, checkbox, field_error_class, error_div_class) {
	if(checkbox === undefined) {
		checkbox = false;
	}	
	if(field_error_class === undefined) {
		field_error_class = 'login-text-box-error';
	}	
	//console.log('error_div_class is ' + error_div_class);
	if(error_div_class === undefined) {
		error_div_class = 'login-form-error-text';
	}	
	if (error_arr.length >= 1) {
		error_message_div.attr('class', error_div_class);
		if (checkbox) {
			error_field.attr('class', 'login-checkbox-error');
		}
		else {
			error_field.attr('class', field_error_class);
		}

		var error_unordered_list = $('<ul>');
		var error_unordered_id = id_prefix + "-error-ul";
		error_unordered_list.attr("id", error_unordered_id);
		error_unordered_list.attr("class", "form-errors");
		error_message_div.append(error_unordered_list);
		for (i = 0; i < error_arr.length; i++) { 
			var error_message = '<li>' + error_arr[i]['description'] + '</li>';
			error_unordered_list.append(error_message);
		}
	}
}

$.display_page_fatal_error = function(element_id, message) {
	if(message === undefined) {message = null;}
	$('#' + element_id).empty();
	if (message != null) {
		$('#' + element_id).append(message);
	}
	else {
		$('#' + element_id).append('We\'re sorry. An error has occurred while loading this page. Please try refreshing the page. If that doesn\'t work, please clear browser cache and cookies and try reloading again.');
	}
}

$.build_select_box = function(id, name, css_class, selected_value, values) {
	var select_box_str = '<select id="' + id + '" name="' + name + '" class="' + css_class + '">';
	for (var i = 0; i < values.length; i++) {
		if (values[i] == selected_value) {
			select_box_str += '<option value="' + values[i] + '" selected>' + values[i] + '</option>';
		}
		else {
			select_box_str += '<option value="' + values[i] + '">' + values[i] + '</option>';
		}
	}
	select_box_str += '</select>';
	return select_box_str;
}
	
$.are_arrays_equal = function(arr1,arr2) {
	for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) { 
            return false;   
        }           
    }       
    return true;
}



