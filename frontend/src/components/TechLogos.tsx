import React from 'react';

import argoCdLogoUrl from '../assets/logos/Argo CD.png';
import awsLogoUrl from '../assets/logos/AWS.png';
import azureDevopsLogoUrl from '../assets/logos/Azure Devops.png';
import azureLogoUrl from '../assets/logos/Azure.png';
import dockerLogoUrl from '../assets/logos/Docker.png';
import gitLogoUrl from '../assets/logos/Git.png';
import githubActionsLogoUrl from '../assets/logos/GitHub Actions.png';
import gcpLogoUrl from '../assets/logos/Google Cloud.png';
import terraformLogoUrl from '../assets/logos/HashiCorp Terraform.png';
import jenkinsLogoUrl from '../assets/logos/Jenkins.png';
import k8sLogoUrl from '../assets/logos/Kubernetes.png';
import linuxLogoUrl from '../assets/logos/Linux.png';
import powershellLogoUrl from '../assets/logos/Powershell.png';

interface LogoProps {
  className?: string;
}

export const LinuxLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={linuxLogoUrl} 
    alt="Linux Tux" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const DockerLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={dockerLogoUrl} 
    alt="Docker Moby Whale" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const K8sLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={k8sLogoUrl} 
    alt="Kubernetes" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const TerraformLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={terraformLogoUrl} 
    alt="HashiCorp Terraform" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const GitLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={gitLogoUrl} 
    alt="Git" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const ArgoCDLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={argoCdLogoUrl} 
    alt="ArgoCD Octopus" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const GitHubActionsLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={githubActionsLogoUrl} 
    alt="GitHub Actions" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const JenkinsLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={jenkinsLogoUrl} 
    alt="Jenkins Butler" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const ShellLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={powershellLogoUrl} 
    alt="Shell / PowerShell" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const GitOpsLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={argoCdLogoUrl} 
    alt="GitOps" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const CicdLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={azureDevopsLogoUrl} 
    alt="CI / CD (Azure DevOps)" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const AwsLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={awsLogoUrl} 
    alt="AWS" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const AzureLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={azureLogoUrl} 
    alt="Azure" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const GcpLogo: React.FC<LogoProps> = ({ className = "h-7 w-7" }) => (
  <img 
    src={gcpLogoUrl} 
    alt="GCP" 
    className={`${className} object-contain shrink-0`} 
  />
);

export const ToolLogo: React.FC<{ id: string; className?: string }> = ({ id, className = "h-7 w-7" }) => {
  switch (id) {
    case 'linux': return <LinuxLogo className={className} />;
    case 'docker': return <DockerLogo className={className} />;
    case 'kubernetes': return <K8sLogo className={className} />;
    case 'terraform': return <TerraformLogo className={className} />;
    case 'git': return <GitLogo className={className} />;
    case 'argocd': return <ArgoCDLogo className={className} />;
    case 'github-actions': return <GitHubActionsLogo className={className} />;
    case 'jenkins': return <JenkinsLogo className={className} />;
    case 'shell': return <ShellLogo className={className} />;
    case 'gitops': return <GitOpsLogo className={className} />;
    case 'cicd': return <CicdLogo className={className} />;
    case 'aws': return <AwsLogo className={className} />;
    case 'azure': return <AzureLogo className={className} />;
    case 'gcp': return <GcpLogo className={className} />;
    default: return <LinuxLogo className={className} />;
  }
};
