<!DOCTYPE html>
<html lang="en">
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Log In</title>
        <link rel="stylesheet" type="text/css" href="/css/main-0.0.1.css"> 
		<link href="https://fonts.googleapis.com/css?family=Archivo+Narrow:400,400i,500,500i,600,600i,700,700i" rel="stylesheet">
        <link rel="icon" type="image/png" href="img/favicon.1.png" />
	</head>
	<body>
        <div id="header-prefix" class="container container-header-prefix"></div>
    	<div id="header" class="container container-header"></div>
        <div id="header-error" class="header-error hide"></div>
    	<div id="hamburger-menu-open" class="container container-menu-expanded hide"></div>
        <div class="container container-white-bg container-padded container-first">
            <section-full><div class="section-title">Log In or Create an Account</div></section-full>
            <section-full-no-top-margin>
                <div id="login-general-notification" class="account-my-information-note"></div>
                <div class="section-text">
                    <div id="login-wrapper" class="login-wrapper">
                        <div id="login-form-wrapper" class="login-form-wrapper">
                            <div class="login-section-title login-section-title-hidden">Already Registered?</div>
                            <div class="login-instruction-text">If you have an account with us please log in.</div>
                            <div id="login-general-error" class="login-form-error-text-hidden"></div>
                            <input type="text" id="login-username" class="login-text-box" placeholder="Username *">
                            <div id="login-username-error" class="login-form-error-text-hidden"></div>
                            <input type="password" id="login-pswd" class="login-text-box" placeholder="Password *">
                            <div id="login-password-error" class="login-form-error-text-hidden"></div>
                            <div class="login-reset-password-wrapper">
                                <a href="/reset-password">Reset Your Password</a>
                            </div>
                            <div class="login-reset-password-wrapper">
                                <a href="/forgot-username">Forgot Your Username?</a>
                            </div>
                            <div class="login-remember-me-wrapper">
                                <input type="checkbox" class="login-remember-me-checkbox" id="remember_me" title="Remember Me">&nbsp;Keep me logged in
                            </div>
                            <div class="login-go-button-wrapper">
                                <input id="login-go" type="submit" class="login-go-button" value="LOGIN">
                            </div>
                        </div>
                        <div class="sign-up-form-divider"></div>
                        <div class="sign-up-wrapper">
                            <div class="login-section-title">New Here?</div>
                            <div class="login-instruction-text login-instruction-text-bottom-margin">Registration is free and easy!</div>
                            <div class="login-go-button-wrapper">
                                <input id="create-account" type="submit" class="login-go-button" value="CREATE AN ACCOUNT">
                            </div>
                        </div>
                    </div>
                </div>
            </section-full-no-top-margin>
        </div>
        <div id="footerContent"></div>
        <script src="/js/jquery/3.2.1/jquery.min.js"></script>
        <script src="/js/index-0.0.1.js"></script>
        <script src="/js/utilities/form-utilities-0.0.1.js"></script>
        <script src="/js/utilities/rg-utilities-0.0.1.js"></script>
        <script src="/js/login-0.0.1.js"></script>
	</body>
</html>
