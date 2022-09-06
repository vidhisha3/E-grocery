const createNav = () => {
    let nav = document.querySelector('.navbar');
    nav.innerHTML=
    `
<div class="nav">
    <img src="../img/logo.png" class="brand-logo" alt="">
    <div class="nav-items">
        <div class="search">
            <input type="text" class="search-box" placeholder="search brand, product">
            <button class="search-btn"> search</button>
        </div>
        <a>
    <img src="../img/user.png" id ="user-img" alt="">
    <div class="login-logout-popup hide" >
        <p class="account-info"> Login as, name</p>
     <button class="btn" id="user-btn">Log Out </button>   
    </div>
</a>
        <a href="/cart"><img src="../img/cart.png" alt=""></a>
    </div>
</div>
		<ul class="links-containers">
			<li class ="link-item"><a href="index.html" class="link"> Home </a></li>
			<li class ="link-item"><a href="Fruits.html" class="link"> Fruits </a></li>
			<li class ="link-item"><a href="vegetables.html" class="link">Vegetable </a></li>
            <li class ="link-item"><a href="#" class="link"> Dairy Products </a></li>
			<li class ="link-item"><a href="vendor.html" class="link"> Vendor </a></li>
			</ul> 
    `;
}

createNav();

//login popup
const userImageButton = document.querySelector('#user-img');
const userPopup = document.querySelector('.login-logout-popup');
const popuptext = document.querySelector('.account-info');
const actionBtn = document.querySelector('#user-btn');

userImageButton.addEventListener('click', ()=>{
    userPopup.classList.toggle('hide');
})

window.onload = () => {
    let user = JSON.parse(sessionStorage.user || null);
    if(user != null){
        // if user is not null then user is logged in
        popuptext.innerHTML = `logged in as, ${user.name}`;
        actionBtn.innerHTML = 'Log Out';
        actionBtn.addEventListener('click', () =>{ 
            sessionStorage.clear();
            location.reload();
        })
    }else{
        // or else the user is logged out
        popuptext.innerHTML = 'Login to place an Order';
        actionBtn.innerHTML = 'Log-In';
        actionBtn.addEventListener('click', ()=> {
            location.href = '/login';
        })
    }
}

//search box
const searchBtn = document.querySelector('.search-btn');
const searchBox = document.querySelector('.search-box');
searchBtn.addEventListener('click',() => {
    if(searchBox.value.length){
        location.href = `/search/${searchBox.value}`
    }
})