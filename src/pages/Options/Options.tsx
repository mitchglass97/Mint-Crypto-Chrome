import React from 'react';
import './Options.css';
import "./github-logo.png";

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  return (
  <div className="OptionsContainer">
    <div className="top">
      <h3>Thank <span>you</span> for using Mint Cryptocurrency</h3>
    </div>
    <div className="bottom">
      <a href="https://github.com/mitchglass97/Mint-Crypto">
        <h3>GitHub Repo</h3>
        <img src="./github-logo.png"  width="200" height="200"></img>
      </a>
    </div>
  </div>
  );
};

export default Options;
