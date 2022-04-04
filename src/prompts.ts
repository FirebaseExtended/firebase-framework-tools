// Copyright 2022 Google LLC
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type {
  FirebaseProject,
  FirebaseHostingSite,
} from 'firebase-tools';

import { getFirebaseTools, getInquirer } from './firebase';

const NEW_OPTION = '(~~new~~)';
const DEFAULT_SITE_TYPE = 'DEFAULT_SITE';

export const shortSiteName = (site?: FirebaseHostingSite) => site?.name && site.name.split('/').pop();

export const userPrompt = async (options: {}): Promise<Record<string, any>> => {
  const firebaseTools = await getFirebaseTools();
  const users = await firebaseTools.login.list();
  if (!users || users.length === 0) {
    await firebaseTools.login(); // first login isn't returning anything of value
    const user = await firebaseTools.login(options);
    return user;
  } else {
    const defaultUser = await firebaseTools.login(options);
    const choices = users.map(({user}) => ({ name: user.email, value: user }));
    const newChoice = { name: '[Login in with another account]', value: NEW_OPTION };
    const { user } = await getInquirer().prompt({
      type: 'list',
      name: 'user',
      choices: [newChoice].concat(choices as any), // TODO types
      message: 'Which Firebase account would you like to use?',
      default: choices.find(it => it.value.email === defaultUser.email)?.value,
    });
    if (user === NEW_OPTION) {
      const { user } = await firebaseTools.login.add();
      return user;
    }
    return user;
  }
};

export const projectPrompt = async (defaultProject: string|undefined, options: {}) => {
  const firebaseTools = await getFirebaseTools();
  const inquirer = getInquirer();
  const projects = await firebaseTools.projects.list(options);
  const { projectId } = await inquirer.prompt({
    type: 'list',
    name: 'projectId',
    choices: projects.map(it => ({ name: it.displayName, value: it.projectId })),
    message: 'Please select a project:',
    default: defaultProject,
  });
  if (projectId === NEW_OPTION) {
    const { projectId } = await inquirer.prompt({
      type: 'input',
      name: 'projectId',
      message: `Please specify a unique project id (cannot be modified afterward) [6-30 characters]:`,
    });
    const { displayName } = await inquirer.prompt({
      type: 'input',
      name: 'displayName',
      message: 'What would you like to call your project?',
      default: projectId,
    });
    return await firebaseTools.projects.create(projectId, { account: (options as any).account, displayName, nonInteractive: true });
  }
  // tslint:disable-next-line:no-non-null-assertion
  return projects.find(it => it.projectId === projectId)!;
};

export const sitePrompt = async ({ projectId: project }: FirebaseProject, options: {}) => {
  const firebaseTools = await getFirebaseTools();
  const inquirer = getInquirer();
  const { sites } = await firebaseTools.hosting.sites.list({ ...options, project });
  if (sites.length === 0) {
    // newly created projects don't return their default site, stub one
    sites.push({
      name: project,
      defaultUrl: `https://${project}.web.app`,
      type: DEFAULT_SITE_TYPE,
      appId: undefined,
    } as FirebaseHostingSite);
  }
  const { siteName } = await inquirer.prompt({
    type: 'list',
    name: 'siteName',
    choices: sites.map(it => ({ name: it.defaultUrl, value: shortSiteName(it) })),
    message: 'Please select a hosting site:',
    default: shortSiteName(sites.find(it => it.type === DEFAULT_SITE_TYPE)),
  });
  if (siteName === NEW_OPTION) {
    const { subdomain } = await inquirer.prompt({
      type: 'input',
      name: 'subdomain',
      message: 'Please provide an unique, URL-friendly id for the site (<id>.web.app):',
    });
    return await firebaseTools.hosting.sites.create(subdomain, { ...options, nonInteractive: true, project });
  }
  // tslint:disable-next-line:no-non-null-assertion
  return sites.find(it => shortSiteName(it) === siteName)!;
};
