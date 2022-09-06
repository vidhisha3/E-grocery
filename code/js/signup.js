//redirecting to the main page
window.onload = () => {
    if(sessionStorage.user){
        user = JSON.parse(sessionStorage.user);
        if(compareToken(user.authToken, user.email)){
            location.replace('/');
        }
    }
}

const loader =document.querySelector('.loader');
// select inputs 
const submitBtn = document.querySelector('.submit-btn');
const name = document.querySelector('#name') || null;
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const number = document.querySelector('#number')||null;
const tac = document.querySelector('#terms-and-cond')||null;
const notification = document.querySelector('#notification')||null;

submitBtn.addEventListener('click', () => {
    if(name != null){ //signup page
        if(name.value.length < 3){
                    showAlert('name must be 3 letters long');
                } else if(!email.value.length){
                    showAlert('Enter your E-Mail');
                } else if(password.value.length < 8 ){
                    showAlert('Password should be 8 letters long');
                } else if (!number.value.length){
                    showAlert('enter your Phone Number');
                }else if(!Number(number.value) || number.value.length < 10){
                    showAlert('invaild number, please Enter Valid One');
                }else if (!tac.checked){
                showAlert('you must agree to our Terms and Conditions');
               } else{        
                   // submit signup 
                   loader.style.display = 'block';
                   sendData('/signup',{
                           name:name.value,
                           email: email.value,
                           password: password.value,
                           number: number.value,
                           tac: tac.checked,
                           notification:notification.checked,
                           vendor:false
                   })   
               }        
    }  
      
    else{
        //it will take to login page
        if (!email.value.length || !password.value.length){
            showAlert('Enter your login Details correctly');
        }else{
            loader.style.display = 'block';
                   sendData('/login',{
                           email: email.value,
                           password: password.value,
                   })
        }
    }   
 }) 
    
 