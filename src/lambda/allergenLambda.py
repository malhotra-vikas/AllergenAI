import json
import boto3
import time

from botocore.exceptions import NoCredentialsError, PartialCredentialsError

def lambda_handler(event, context):
    # Define the S3 bucket and JSON file key
    bucket_name = '1010public'
    file_key = 'the_cheesecake_factory_allergens.json'

    print("Lambda Event is ", event)
    
    try:
        # Create an S3 client
        s3 = boto3.client('s3')
        
        # Read the JSON file from S3
        response = s3.get_object(Bucket=bucket_name, Key=file_key)
        print("S3 read response ", response)

        # Pause execution for 3 seconds
        time.sleep(3)

        data = json.loads(response['Body'].read().decode('utf-8'))
        print("Data in JSON is ", data)
        
        # Extract the query parameters from the event
        query_item = None
        if event.get('queryStringParameters'):
            query_item = event['queryStringParameters'].get('menu-item', None)
            print("1. query_item  is ", query_item)

        elif event.get('body'):
            body = json.loads(event['body'])
            query_item = body.get('queryStringParameters', {}).get('menu-item', None)
            print("2. query_item  is ", query_item)

        # Check if query_item is provided
        if not query_item:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Please provide a menu item to query.'})
            }
        
        # Search for the menu item in the JSON data
        menu = data.get('menu', [])
        for item in menu:
            if item['item'].lower() == query_item.lower():
                return {
                    'statusCode': 200,
                    'body': json.dumps(item)
                }
        
        # If the item is not found, return a message
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Menu item not found.'})
        }
    
    except NoCredentialsError:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Credentials not available.'})
        }
    except PartialCredentialsError:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Incomplete credentials.'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

