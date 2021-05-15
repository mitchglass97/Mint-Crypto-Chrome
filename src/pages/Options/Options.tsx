import React from "react";
import "./Options.css";
import "./github-logo.png";
import "./btc_QR.jpg";
import "./nano_QR.jpg";

interface Props {
	title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
	return (
		<div className='OptionsContainer'>
			<div className='top'>
				<h3>
					Thank <span>you</span> for using Mint Crypto
				</h3>
			</div>
			<div className='bottom'>
				<div>
					<h3>Donate Bitcoin</h3>
					<img src='./btc_QR.jpg' width='700'></img>
				</div>
				<a href='https://github.com/mitchglass97/Mint-Crypto'>
					<h3>GitHub Repo</h3>
					<img id='github-pic' src='./github-logo.png' width='700'></img>
				</a>
				<div id='nano'>
					<h3>Donate Nano</h3>
					<p>nano_35toqmos7p6b6keu8ebw8885s3oqk3jyx7ii58qwg764kapby3apkq5ht57q</p>
				</div>
			</div>
		</div>
	);
};

export default Options;
